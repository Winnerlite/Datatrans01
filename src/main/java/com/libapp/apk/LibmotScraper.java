package com.libapp.apk;

import java.io.*;
import java.net.*;
import java.util.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.json.*;

public class LibmotScraper {

    private static final String API    = "https://api.libmot.com";
    private static final String SITE   = "https://libmot.com";
    private static final String LIBMOT_USER = "web@libmot.com";
    private static final String LIBMOT_PASS = "Lme@onl1n3";
    private static final String UA     = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    
    private static final String WORKER_UPLOAD_URL = "https://intercitypricesbookings.cybercatclientcreator.workers.dev/api/upload/libmot";

    private static String bearerToken = null;

    public static void main(String[] args) throws Exception {
        String apiKey       = getEnv("WORKER_API_KEY", null);
        String workerOrigin = getEnv("WORKER_ORIGIN", "https://www.intercityprices.com.ng");

        if (apiKey == null) {
            System.err.println("FATAL: WORKER_API_KEY env var is not set");
            System.exit(1);
        }

        // Generate Today and Tomorrow dates in Nigeria Time (Africa/Lagos)
        ZoneId lagosZone = ZoneId.of("Africa/Lagos");
        LocalDate now = LocalDate.now(lagosZone);
        List<String> datesToScrape = Arrays.asList(
            now.format(DateTimeFormatter.ISO_LOCAL_DATE),           // Today
            now.plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE) // Tomorrow
        );

        System.out.println("=== Libmot scraper starting ===");
        System.out.println("Dates: " + datesToScrape + " | Origin header: " + workerOrigin);
        System.out.println("Worker: " + WORKER_UPLOAD_URL + "\n");

        ensureToken();

        // 1. Fetch all Terminals (Origins)
        List<Terminal> terminals = getTerminals();
        System.out.println("Loaded " + terminals.size() + " terminal(s).\n");

        int uploaded = 0, failed = 0;

        // 2. Loop through Terminals
        for (Terminal origin : terminals) {
            System.out.println("=== Origin: " + origin.name + " (ID: " + origin.id + ") ===");
            
            // 3. Fetch Destinations for this Terminal
            List<Terminal> destinations;
            try {
                destinations = getDestinations(origin.id);
            } catch (Exception e) {
                System.err.println("  ✗ Failed to load destinations: " + e);
                continue;
            }

            if (destinations.isEmpty()) {
                System.out.println("  No destinations found.");
                continue;
            }

            // 4. Loop through Destinations
            for (Terminal dest : destinations) {
                System.out.println("  → " + dest.name + " (ID: " + dest.id + ")");

                // 5. Loop through Dates
                for (String date : datesToScrape) {
                    try { Thread.sleep(400); } catch (InterruptedException ignored) {} // API rate limiting safety

                    List<JSONObject> trips;
                    try {
                        trips = searchTrips(origin.id, dest.id, date);
                    } catch (Exception e) {
                        System.err.println("     ✗ Search error (" + date + "): " + e);
                        continue;
                    }

                    System.out.println("     [" + date + "] " + trips.size() + " trip(s)");

                    // 6. Loop through Trips and Upload
                    for (JSONObject trip : trips) {
                        try {
                            int code = uploadTrip(trip, origin.id, dest.id, apiKey, workerOrigin);
                            if (code == 200) { 
                                uploaded++; 
                                System.out.println("     ✓ uploaded " + trip.optString("vehicleTripRegistrationId")); 
                            } else { 
                                failed++;   
                                System.err.println("     ✗ upload HTTP " + code + " for " + trip.optString("vehicleTripRegistrationId")); 
                            }
                        } catch (Exception e) {
                            failed++;
                            System.err.println("     ✗ upload exception: " + e);
                        }
                    }
                }
            }
        }

        System.out.println("\n=== DONE: uploaded=" + uploaded + " failed=" + failed + " ===");
        if (uploaded == 0 && failed > 0) System.exit(1);
    }

    // ─────────────── API Calls ───────────────

    private static void ensureToken() throws Exception {
        if (bearerToken != null) return;
        System.out.println("Authenticating with Libmot API...");
        JSONObject body = new JSONObject();
        body.put("username", LIBMOT_USER); body.put("password", LIBMOT_PASS);
        String[] resp = rawPost("/api/Token", body.toString(), null);
        if (resp == null || !resp[0].startsWith("2")) throw new Exception("Token fail");
        bearerToken = new JSONObject(resp[1]).optJSONObject("object").optString("token", null);
        if (bearerToken == null || bearerToken.isEmpty()) throw new Exception("Token missing in response");
    }

    private static List<Terminal> getTerminals() throws Exception {
        String[] resp = apiGet("/api/Terminal/Cities");
        if (resp == null || !resp[0].startsWith("2")) throw new Exception("HTTP Fail fetching terminals");
        JSONArray arr = new JSONObject(resp[1]).optJSONArray("object");
        List<Terminal> out = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject t = arr.getJSONObject(i);
            String state = t.optString("stateName", "");
            String name = state.isEmpty() ? t.optString("name") : t.optString("name") + " (" + state + ")";
            out.add(new Terminal(t.optInt("id"), name));
        }
        return out;
    }

    private static List<Terminal> getDestinations(int originId) throws Exception {
        String[] resp = apiGet("/api/Route/GetDestinationTerminals/" + originId);
        if (resp == null || !resp[0].startsWith("2")) throw new Exception("HTTP Fail fetching destinations");
        JSONArray arr = new JSONObject(resp[1]).optJSONArray("object");
        List<Terminal> out = new ArrayList<>();
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                out.add(new Terminal(arr.getJSONObject(i).optInt("id"), arr.getJSONObject(i).optString("name")));
            }
        }
        return out;
    }

    private static List<JSONObject> searchTrips(int originId, int destId, String dateStr) throws Exception {
        JSONObject body = new JSONObject();
        body.put("tripType", 0); 
        body.put("departureTerminalId", originId); 
        body.put("destinationTerminalId", destId);
        body.put("departureDate", dateStr + "T00:00:00"); 
        body.put("returnDate", dateStr + "T00:00:00");
        body.put("numberOfAdults", 1); 
        body.put("numberOfChildren", 0); 
        body.put("email", "noreply@libmot.com");

        String[] resp = apiPost("/api/Booking/Search", body.toString());
        if (resp == null || !resp[0].startsWith("2")) throw new Exception("HTTP Fail: " + (resp != null ? resp[1] : "null"));

        JSONObject obj = new JSONObject(resp[1]).optJSONObject("object");
        JSONArray departures = obj != null ? obj.optJSONArray("departures") : null;
        
        List<JSONObject> out = new ArrayList<>();
        if (departures != null) {
            for (int i = 0; i < departures.length(); i++) {
                out.add(departures.getJSONObject(i));
            }
        }
        return out;
    }

    private static int uploadTrip(JSONObject t, int originId, int destId, String apiKey, String workerOrigin) throws IOException, JSONException {
        JSONObject payload = new JSONObject();
        payload.put("route", t.optString("routeName"));
        payload.put("coach", t.optString("vehicleModel"));
        payload.put("type", t.optString("vehicleName"));
        payload.put("departure", t.optString("departureTime"));
        payload.put("fare", t.optDouble("farePrice"));
        payload.put("date", t.optString("departureDate"));
        payload.put("tripId", t.optString("vehicleTripRegistrationId"));
        payload.put("capacity", t.optInt("totalNumberOfSeats"));
        payload.put("availableSeats", t.optInt("availableNumberOfSeats"));
        payload.put("originId", String.valueOf(originId));
        payload.put("destId", String.valueOf(destId));
        payload.put("routeId", t.optInt("routeId"));
        
        JSONArray availArr = t.optJSONArray("availableSeats");
        Set<Integer> available = new HashSet<>();
        if (availArr != null) {
            for (int j = 0; j < availArr.length(); j++) available.add(availArr.getInt(j));
        }
        
        int totalSeats = t.optInt("totalNumberOfSeats");
        JSONArray seatsArray = new JSONArray();
        for (int n = 1; n <= totalSeats; n++) {
            JSONObject seat = new JSONObject(); 
            seat.put("number", n); 
            seat.put("status", available.contains(n) ? "free" : "booked"); 
            seatsArray.put(seat);
        }
        
        payload.put("seats", seatsArray); 
        payload.put("seatMapText", formatSeatMap(totalSeats, available));

        HttpURLConnection c = (HttpURLConnection) new URL(WORKER_UPLOAD_URL).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setConnectTimeout(20_000);
        c.setReadTimeout(30_000);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("x-api-key", apiKey);
        c.setRequestProperty("Origin", workerOrigin);

        OutputStream os = c.getOutputStream(); 
        os.write(payload.toString().getBytes("UTF-8")); 
        os.close();
        
        int code = c.getResponseCode();
        if (code != 200) {
            InputStream es = c.getErrorStream();
            if (es != null) System.err.println("     worker body: " + readAll(es));
        }
        c.disconnect();
        return code;
    }

    private static String formatSeatMap(int totalSeats, Set<Integer> available) {
        StringBuilder sb = new StringBuilder("[Driver]\n");
        int perRow = totalSeats <= 12 ? 3 : 4;
        for (int i = 1; i <= totalSeats; i++) {
            String s = i < 10 ? " " + i : String.valueOf(i);
            sb.append(available.contains(i) ? "[" + s + "] " : "[" + s + "*] ");
            if (i % perRow == 0 || i == totalSeats) sb.append("\n");
        }
        return sb.append("(* = Booked)").toString();
    }

    // ─────────────── HTTP Helpers ───────────────

    private static String[] apiGet(String path) {
        String[] r = rawGet(path, bearerToken);
        if (r != null && "401".equals(r[0])) { 
            bearerToken = null; 
            try { ensureToken(); r = rawGet(path, bearerToken); } catch (Exception ignored) {} 
        }
        return r;
    }

    private static String[] apiPost(String path, String body) {
        String[] r = rawPost(path, body, bearerToken);
        if (r != null && "401".equals(r[0])) { 
            bearerToken = null; 
            try { ensureToken(); r = rawPost(path, body, bearerToken); } catch (Exception ignored) {} 
        }
        return r;
    }

    private static String[] rawGet(String path, String token) {
        HttpURLConnection c = null;
        try {
            URL url = new URL(API + path); c = (HttpURLConnection) url.openConnection();
            c.setRequestMethod("GET"); c.setRequestProperty("User-Agent", UA); c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("Origin", SITE); if (token != null) c.setRequestProperty("Authorization", "Bearer " + token);
            c.setConnectTimeout(20000); c.setReadTimeout(30000); return readResponse(c);
        } catch (Exception e) { return null; } finally { if (c != null) c.disconnect(); }
    }

    private static String[] rawPost(String path, String body, String token) {
        HttpURLConnection c = null;
        try {
            URL url = new URL(API + path); c = (HttpURLConnection) url.openConnection();
            c.setRequestMethod("POST"); c.setDoOutput(true); c.setRequestProperty("User-Agent", UA);
            c.setRequestProperty("Content-Type", "application/json; charset=utf-8"); c.setRequestProperty("Accept", "application/json");
            c.setRequestProperty("Origin", SITE); if (token != null) c.setRequestProperty("Authorization", "Bearer " + token);
            c.setConnectTimeout(20000); c.setReadTimeout(30000);
            OutputStream os = c.getOutputStream(); os.write(body.getBytes("UTF-8")); os.close();
            return readResponse(c);
        } catch (Exception e) { return null; } finally { if (c != null) c.disconnect(); }
    }

    private static String[] readResponse(HttpURLConnection c) throws Exception {
        int code = c.getResponseCode();
        InputStream is = (code >= 400) ? c.getErrorStream() : c.getInputStream();
        StringBuilder sb = new StringBuilder();
        if (is != null) {
            BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            String line; while ((line = br.readLine()) != null) sb.append(line).append('\n'); br.close();
        }
        return new String[]{String.valueOf(code), sb.toString()};
    }

    private static String readAll(InputStream is) throws IOException {
        if (is == null) return "";
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) > 0) bos.write(buf, 0, n);
        is.close();
        return bos.toString("UTF-8");
    }

    private static String getEnv(String key, String fallback) {
        String v = System.getenv(key);
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    // Inner class for Terminals
    static class Terminal {
        int id; String name;
        Terminal(int id, String name) { this.id = id; this.name = name; }
    }
}
