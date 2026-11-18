package com.benue.apk;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.regex.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.json.*;

public class Scraper {

    private static final String BASE_URL    = "https://benuelinks.com";
    private static final String WORKER_URL  = "https://intercitypricesbookings.cybercatclientcreator.workers.dev/api/upload/benuelinks";
    private static final String USER_AGENT  = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";

    private static final String[] ORIGIN_NAMES = {"Abuja", "Makurdi", "Lagos_Iddo", "Abuja_Airport"};
    private static final String[] ORIGIN_IDS   = {
        "63f369f338fa49354b1a153d",
        "63f3345119401685e94f4003",
        "640cdbab42631ce79d23437b",
        "682ae9c8ef93060702fe5fc3"
    };

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

        System.out.println("=== BenueLinks scraper starting ===");
        System.out.println("Dates: " + datesToScrape + " | Origin header: " + workerOrigin);
        System.out.println("Worker: " + WORKER_URL + "\n");

        CookieHandler.setDefault(new CookieManager());

        int uploaded = 0, failed = 0;

        for (int i = 0; i < ORIGIN_IDS.length; i++) {
            String originId = ORIGIN_IDS[i];
            System.out.println("=== Origin: " + ORIGIN_NAMES[i] + " (" + originId + ") ===");

            List<String> destinations;
            try {
                destinations = loadDestinations(originId);
            } catch (Exception e) {
                System.err.println("  ✗ Failed to load destinations: " + e);
                continue;
            }
            System.out.println("  Found " + destinations.size() + " destinations");

            for (String dest : destinations) {
                System.out.println("  → " + dest);
                
                // Loop through Today and Tomorrow for this destination
                for (String date : datesToScrape) {
                    try { Thread.sleep(500); } catch (InterruptedException ignored) {}

                    List<Map<String, String>> trips;
                    try {
                        trips = searchTrips(originId, dest, date);
                    } catch (Exception e) {
                        System.err.println("     ✗ Search error (" + date + "): " + e);
                        continue;
                    }

                    System.out.println("     [" + date + "] " + trips.size() + " trip(s)");

                    for (Map<String, String> trip : trips) {
                        String tripId = trip.get("TripId");
                        if (tripId == null || tripId.isEmpty()) continue;

                        try { Thread.sleep(300); } catch (InterruptedException ignored) {}

                        try {
                            List<String> seatList = fetchSeatMap(tripId);
                            trip.put("SeatMapData", formatSeatMap(seatList));
                            trip.put("RawSeatList", new JSONArray(seatList).toString());
                        } catch (Exception e) {
                            System.err.println("     ⚠ Seat map failed for " + tripId + ": " + e);
                            trip.put("SeatMapData", "(seat map unavailable)");
                            trip.put("RawSeatList", "[]");
                        }

                        trip.put("OriginId", originId);
                        trip.put("DestId",   dest);

                        try {
                            int code = uploadTrip(trip, apiKey, workerOrigin);
                            if (code == 200) { uploaded++; System.out.println("     ✓ uploaded " + tripId); }
                            else             { failed++;   System.err.println("     ✗ upload HTTP " + code + " for " + tripId); }
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

    private static String getEnv(String key, String fallback) {
        String v = System.getenv(key);
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    // ─────────────── Destinations ───────────────

    private static List<String> loadDestinations(String originId) throws Exception {
        httpGet(BASE_URL + "/");
        String body = "{\"origin\":\"" + originId + "\"}";
        String json = httpPost(BASE_URL + "/postGetDestinations?getCSRF=true", "application/json", body).trim();
        JSONArray arr = new JSONArray(json);
        List<String> out = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            try { out.add(arr.getString(i)); } catch (Exception ignored) {}
        }
        return out;
    }

    // ─────────────── Search ───────────────

    private static List<Map<String, String>> searchTrips(String originId, String destId, String date) throws Exception {
        String home = httpGet(BASE_URL + "/");
        String csrf = extractCsrf(home);

        String body = "origin="      + URLEncoder.encode(originId, "UTF-8")
                    + "&destination=" + URLEncoder.encode(destId, "UTF-8")
                    + "&date="       + URLEncoder.encode(date, "UTF-8")
                    + "&_csrf="      + URLEncoder.encode(csrf, "UTF-8");

        String html = httpPost(BASE_URL + "/search-schedule", "application/x-www-form-urlencoded", body);
        return parseSchedule(html);
    }

    // ─────────────── Upload ───────────────

    private static int uploadTrip(Map<String, String> trip, String apiKey, String workerOrigin) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("route",         safe(trip, "Route"));
        payload.put("coach",         safe(trip, "Coach"));
        payload.put("type",          safe(trip, "Type"));
        payload.put("departure",     safe(trip, "Departure"));
        payload.put("duration",      safe(trip, "Duration"));
        payload.put("boarding",      safe(trip, "Boarding"));
        payload.put("fare",          safe(trip, "Fare"));
        payload.put("date",          safe(trip, "Date"));
        payload.put("tripId",        safe(trip, "TripId"));
        payload.put("originId",      safe(trip, "OriginId"));
        payload.put("destId",        safe(trip, "DestId"));
        payload.put("routeId",       0);   // not exposed by benuelinks
        payload.put("capacity",      parseIntSafe(trip.get("Capacity")));
        payload.put("availableSeats",parseIntSafe(trip.get("AvailableSeats")));
        payload.put("seatMapText",   safe(trip, "SeatMapData"));

        JSONArray seatsArray = new JSONArray();
        String raw = trip.get("RawSeatList");
        if (raw != null && !raw.isEmpty()) {
            JSONArray rawList = new JSONArray(raw);
            for (int i = 0; i < rawList.length(); i++) {
                String[] parts = rawList.getString(i).split(":");
                if (parts.length != 2) continue;
                JSONObject s = new JSONObject();
                s.put("number", parseIntSafe(parts[0]));
                s.put("status", parts[1].equals("BOOKED") ? "booked" : "free");
                seatsArray.put(s);
            }
        }
        payload.put("seats", seatsArray);

        HttpURLConnection c = (HttpURLConnection) new URL(WORKER_URL).openConnection();
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

    private static String safe(Map<String, String> m, String k) {
        String v = m.get(k);
        return v == null ? "" : v;
    }

    private static int parseIntSafe(String s) {
        if (s == null) return 0;
        try { return Integer.parseInt(s.replaceAll("[^0-9-]", "")); }
        catch (Exception e) { return 0; }
    }

    // ─────────────── HTML parsing (unchanged logic) ───────────────

    private static List<Map<String, String>> parseSchedule(String html) {
        List<Map<String, String>> result = new ArrayList<>();
        Pattern rowP = Pattern.compile("<div\\s+class=\"(t-row[^\"]*)\"[^>]*>");
        Matcher rm = rowP.matcher(html);
        List<Integer> rowStart = new ArrayList<>(), rowEnd = new ArrayList<>();
        while (rm.find()) {
            if (rm.group(1).contains("header")) continue;
            rowStart.add(rm.start()); rowEnd.add(rm.end());
        }

        Pattern cellP = Pattern.compile("<div[^>]*data-title=\"([^\"]+)\"[^>]*>");

        for (int r = 0; r < rowStart.size(); r++) {
            int start = rowEnd.get(r);
            int end   = (r + 1 < rowStart.size()) ? rowStart.get(r + 1) : html.length();
            if (end - start > 6000) end = start + 6000;
            String chunk = html.substring(start, end);

            Matcher cm = cellP.matcher(chunk);
            List<String> titles = new ArrayList<>(); List<Integer> cells = new ArrayList<>();
            while (cm.find()) { titles.add(cm.group(1).trim()); cells.add(cm.end()); }

            Map<String, String> trip = new HashMap<>();
            String routeCell = null;

            for (int i = 0; i < titles.size(); i++) {
                int cellEnd = (i + 1 < cells.size()) ? cells.get(i + 1) : chunk.length();
                String content = chunk.substring(cells.get(i), cellEnd);
                String title = titles.get(i);
                if      ("Coach".equals(title))            trip.put("Coach", extractVehicle(content));
                else if ("Type".equals(title))             trip.put("Type", extractSubheading(content));
                else if ("Route".equals(title))            routeCell = content;
                else if ("Fare(NGN)".equals(title))        trip.put("Fare", cleanText(content));
                else if ("Date".equals(title))             trip.put("Date", cleanText(content));
                else if ("Capacity".equals(title))         trip.put("Capacity", cleanText(content));
                else if ("Available Seats".equals(title))  trip.put("AvailableSeats", cleanText(content));
                else if (title.contains("Destination") || title.contains("Boarding"))
                    trip.put("Boarding", cleanText(content));
            }

            if (routeCell != null) {
                Matcher am = Pattern.compile("<a\\s+href=\"/schedule-details/([^\"]+)\"[^>]*>(.*?)</a>", Pattern.DOTALL).matcher(routeCell);
                if (am.find()) {
                    trip.put("TripId", am.group(1).trim());
                    trip.put("Route",  cleanText(am.group(2)));
                }
                Matcher sm = Pattern.compile("<span\\s+class=\"subheading\"[^>]*>(.*?)</span>\\s*:?\\s*([^<]*)", Pattern.DOTALL).matcher(routeCell);
                if (sm.find()) {
                    trip.put("Departure", cleanText(sm.group(1)));
                    trip.put("Duration",  cleanText(sm.group(2)));
                }
            }

            for (String k : new String[]{"Coach","Type","Route","TripId","Departure","Duration","Fare","Date","Capacity","AvailableSeats","Boarding"})
                trip.putIfAbsent(k, "");

            if (!trip.get("Route").isEmpty()) result.add(trip);
        }
        return result;
    }

    private static List<String> fetchSeatMap(String tripId) {
        List<String> result = new ArrayList<>();
        try {
            String html = httpGet(BASE_URL + "/getChooseSeat/" + tripId);
            Pattern p = Pattern.compile("<div\\s+class=[\"']cont-checkbox[^\"']*[\"'][^>]*title=[\"']Seat:\\s*(\\d+)[^\"']*[\"'][^>]*>(.*?)</div>", Pattern.DOTALL);
            Matcher m = p.matcher(html);
            while (m.find()) {
                String seatNum = m.group(1);
                String block   = m.group(2);
                boolean booked = block.contains("notallowed") || block.contains("disabled") || block.contains("booked");
                result.add(seatNum + ":" + (booked ? "BOOKED" : "FREE"));
            }
        } catch (Exception ignored) {}
        return result;
    }

    private static String formatSeatMap(List<String> seats) {
        if (seats == null || seats.isEmpty()) return "(Seat map unavailable)";
        Set<String> booked = new HashSet<>();
        for (String s : seats) if (s.endsWith(":BOOKED")) booked.add(s.split(":")[0]);
        StringBuilder sb = new StringBuilder();
        int total = seats.size();

        if (total == 14) {
            sb.append("[Driver] [").append(booked.contains("1")  ? " 1*" : " 1").append("] [").append(booked.contains("2")  ? " 2*" : " 2").append("]\n");
            sb.append("[").append(booked.contains("3")  ? " 3*" : " 3").append("] [").append(booked.contains("4")  ? " 4*" : " 4").append("] [").append(booked.contains("5")  ? " 5*" : " 5").append("]\n");
            sb.append("[").append(booked.contains("6")  ? " 6*" : " 6").append("] [").append(booked.contains("7")  ? " 7*" : " 7").append("] [").append(booked.contains("8")  ? " 8*" : " 8").append("]\n");
            sb.append("[").append(booked.contains("9")  ? " 9*" : " 9").append("] [").append(booked.contains("10") ? "10*" : "10").append("] [").append(booked.contains("11") ? "11*" : "11").append("]\n");
            sb.append("[").append(booked.contains("12") ? "12*" : "12").append("] [").append(booked.contains("13") ? "13*" : "13").append("] [").append(booked.contains("14") ? "14*" : "14").append("]\n");
        } else if (total == 7) {
            sb.append("[Driver] [").append(booked.contains("1") ? " 1*" : " 1").append("]\n");
            sb.append("[").append(booked.contains("2") ? " 2*" : " 2").append("] [").append(booked.contains("3") ? " 3*" : " 3").append("] [").append(booked.contains("4") ? " 4*" : " 4").append("]\n");
            sb.append("[").append(booked.contains("5") ? " 5*" : " 5").append("] [").append(booked.contains("6") ? " 6*" : " 6").append("] [").append(booked.contains("7") ? " 7*" : " 7").append("]\n");
        } else {
            for (int i = 0; i < total; i++) {
                String num = seats.get(i).split(":")[0];
                boolean b  = seats.get(i).endsWith(":BOOKED");
                sb.append("[").append(num).append(b ? "*" : " ").append("] ");
                if ((i + 1) % 4 == 0 && (i + 1) < total) sb.append("\n");
            }
            sb.append("\n");
        }
        sb.append("(* = Booked)");
        return sb.toString();
    }

    private static String extractVehicle(String cellHtml) {
        Matcher m = Pattern.compile("src=\"([^\"]+)\"").matcher(cellHtml);
        if (!m.find()) return "";
        String src = m.group(1);
        String filename = src.substring(src.lastIndexOf('/') + 1);
        String vehicle = filename.substring(filename.lastIndexOf('-') + 1);
        int dot = vehicle.lastIndexOf('.');
        return (dot > 0 ? vehicle.substring(0, dot) : vehicle).trim();
    }

    private static String extractSubheading(String cellHtml) {
        Matcher m = Pattern.compile("<span\\s+class=\"subheading\"[^>]*>(.*?)</span>", Pattern.DOTALL).matcher(cellHtml);
        return m.find() ? cleanText(m.group(1)) : cleanText(cellHtml);
    }

    private static String cleanText(String s) {
        return s == null ? "" : s.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    // ─────────────── HTTP ───────────────

    private static String httpGet(String url) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("GET");
        c.setRequestProperty("User-Agent", USER_AGENT);
        c.setConnectTimeout(20_000);
        c.setReadTimeout(20_000);
        String r = readAll(c.getResponseCode() >= 400 ? c.getErrorStream() : c.getInputStream());
        c.disconnect();
        return r;
    }

    private static String httpPost(String url, String contentType, String body) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("User-Agent", USER_AGENT);
        c.setRequestProperty("Content-Type", contentType);
        c.setConnectTimeout(20_000);
        c.setReadTimeout(20_000);
        OutputStream os = c.getOutputStream();
        os.write(body.getBytes("UTF-8"));
        os.close();
        String r = readAll(c.getResponseCode() >= 400 ? c.getErrorStream() : c.getInputStream());
        c.disconnect();
        return r;
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

    private static String extractCsrf(String html) {
        Matcher m = Pattern.compile("name=[\"']_csrf[\"'][^>]*?value=[\"']([^\"']+)[\"']").matcher(html);
        if (m.find()) return m.group(1);
        m = Pattern.compile("value=[\"']([^\"']+)[\"'][^>]*?name=[\"']_csrf[\"']").matcher(html);
        return m.find() ? m.group(1) : "";
    }
}
