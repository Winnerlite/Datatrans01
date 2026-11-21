package com.plateauriders.apk;

import com.microsoft.playwright.*;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PlateauScraper {

    private static final String BASE_URL = "https://plateauriders.com";
    private static final String WORKER_URL = "https://intercitypricesbookings.cybercatclientcreator.workers.dev/api/upload/plateauriders";
    private static final String JOS_ID = "2"; // Origin is always Jos

    public static void main(String[] args) throws Exception {
        String apiKey = getEnv("WORKER_API_KEY", null);
        String workerOrigin = getEnv("WORKER_ORIGIN", "https://www.intercityprices.com.ng");

        if (apiKey == null) {
            System.err.println("FATAL: WORKER_API_KEY not set");
            System.exit(1);
        }

        // Dates: Today and Tomorrow (Africa/Lagos)
        ZoneId lagosZone = ZoneId.of("Africa/Lagos");
        LocalDate now = LocalDate.now(lagosZone);
        List<String> datesToScrape = Arrays.asList(
            now.format(DateTimeFormatter.ISO_LOCAL_DATE),
            now.plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        );

        System.out.println("=== Plateau Riders scraper starting ===");
        System.out.println("Dates: " + datesToScrape);

        // 1. Start Headless Browser
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                    .setUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"));
            Page page = context.newPage();

            // 2. Get Destinations from Homepage
            page.navigate(BASE_URL);
            page.waitForLoadState();
            
            String homeHtml = page.content();
            List<Destination> destinations = extractDestinations(homeHtml);
            System.out.println("Found " + destinations.size() + " destinations.\n");

            int totalUploaded = 0;

            // 3. Loop through Destinations and Dates
            for (Destination dest : destinations) {
                for (String date : datesToScrape) {
                    System.out.println("--- Route: Jos -> " + dest.name + " | Date: " + date + " ---");
                    
                    List<JSONObject> trips = scrapeRoute(page, dest, date);
                    System.out.println("  Found " + trips.size() + " trip(s)");

                    for (JSONObject trip : trips) {
                        // Scrape Seats for this trip
                        String tripId = trip.getString("TripId");
                        JSONObject seatData = scrapeSeats(page, tripId);
                        
                        if (seatData != null) {
                            trip.put("Capacity", seatData.getInt("Capacity"));
                            trip.put("AvailableSeats", seatData.getInt("AvailableSeats"));
                            trip.put("seats", seatData.getJSONArray("SeatsArray"));
                            trip.put("seatMapText", seatData.getString("SeatMapText"));
                        } else {
                            trip.put("Capacity", 0);
                            trip.put("AvailableSeats", 0);
                            trip.put("seats", new JSONArray());
                            trip.put("seatMapText", "(seat map unavailable)");
                        }

                        trip.put("originId", JOS_ID);
                        trip.put("destId", dest.id);

                        // Upload
                        int code = uploadTrip(trip, apiKey, workerOrigin);
                        if (code == 200) {
                            totalUploaded++;
                            System.out.println("    ✓ uploaded " + tripId);
                        } else {
                            System.err.println("    ✗ upload failed HTTP " + code);
                        }
                    }
                }
            }
            browser.close();
            System.out.println("\n=== DONE: uploaded=" + totalUploaded + " ===");
        }
    }

    // ─────────────── Scraping Logic ───────────────

    private static List<Destination> extractDestinations(String html) {
        List<Destination> list = new ArrayList<>();
        Matcher m = Pattern.compile("<select[^>]*name=\"destination\"[^>]*>(.*?)</select>", Pattern.DOTALL).matcher(html);
        if (m.find()) {
            Matcher opt = Pattern.compile("<option[^>]*value=\"([^\"]+)\"[^>]*>(.*?)</option>").matcher(m.group(1));
            while (opt.find()) {
                String val = opt.group(1).trim();
                String name = opt.group(2).trim();
                if (!val.isEmpty() && !val.equals(JOS_ID)) {
                    list.add(new Destination(val, name));
                }
            }
        }
        return list;
    }

    private static List<JSONObject> scrapeRoute(Page page, Destination dest, String date) {
        List<JSONObject> trips = new ArrayList<>();
        try {
            page.navigate(BASE_URL);
            page.waitForLoadState();

            // Inject the exact same JS from your Android app
            String js = "(function() {" +
                "var destId = '" + dest.id + "';" +
                "var searchDate = '" + date + "';" +
                "var step = 0;" +
                "var interval = setInterval(function() {" +
                    "if(step === 0) {" +
                        "var origin = document.querySelector('select[name=\"origin\"]');" +
                        "if(origin) { origin.value = '" + JOS_ID + "'; origin.dispatchEvent(new Event('change', {bubbles:true})); step = 1; }" +
                    "} else if(step === 1) {" +
                        "var d = document.querySelector('select[name=\"destination\"]');" +
                        "if(d) { d.value = destId; d.dispatchEvent(new Event('change', {bubbles:true})); step = 2; }" +
                    "} else if(step === 2) {" +
                        "var type = document.querySelector('select[name=\"type\"]');" +
                        "var validValue = null;" +
                        "if(type && type.options.length > 1) {" +
                            "for(var i=0; i<type.options.length; i++) {" +
                                "if(type.options[i].value !== '' && !type.options[i].disabled) { validValue = type.options[i].value; break; }" +
                            "}" +
                        "}" +
                        "if(validValue) {" +
                            "type.value = validValue; type.dispatchEvent(new Event('change', {bubbles:true}));" +
                            "setTimeout(function() {" +
                                "var dt = document.querySelector('input[name=\"date\"]'); if(dt) dt.value = searchDate;" +
                                "var st = document.querySelector('input[name=\"no_of_seats\"]'); if(st) st.value = 1;" +
                                "clearInterval(interval);" +
                                "document.querySelector('form[action*=\"select/vehicles\"]').submit();" +
                            "}, 500);" +
                        "}" +
                    "}" +
                "}, 300);" +
            "})();";
            page.evaluate(js);

            // Wait for results page to load
            page.waitForURL("**/bookings/select/vehicles", new Page.WaitForURLOptions().setTimeout(15000));
            page.waitForTimeout(1500); // Let Livewire render the table

            String html = page.content();
            String lower = html.toLowerCase();
            
            if (lower.contains("fully booked") || lower.contains("unavailable for booking")) {
                return trips;
            }

            // Parse trips
            String route = "Jos to " + dest.name;
            Matcher routeMatcher = Pattern.compile("<h4[^>]*>(.*?)</h4>", Pattern.DOTALL).matcher(html);
            if (routeMatcher.find()) {
                String parsedRoute = cleanText(routeMatcher.group(1));
                if (!parsedRoute.isEmpty()) route = parsedRoute;
            }

            String busType = "Standard";
            Matcher busMatcher = Pattern.compile("<h5[^>]*>(.*?)</h5>", Pattern.DOTALL).matcher(html);
            if (busMatcher.find()) {
                String parsedType = cleanText(busMatcher.group(1));
                if (!parsedType.isEmpty()) busType = parsedType;
            }

            Matcher rowMatcher = Pattern.compile("<tr>(.*?)</tr>", Pattern.DOTALL).matcher(html);
            while (rowMatcher.find()) {
                String rowHtml = rowMatcher.group(1);
                if (!rowHtml.contains("select/seats/")) continue;

                String tripId = "";
                Matcher idMatcher = Pattern.compile("select/seats/(\\d+)").matcher(rowHtml);
                if (idMatcher.find()) tripId = idMatcher.group(1);

                String time = "";
                Matcher timeMatcher = Pattern.compile("<b>Time:\\s*</b>\\s*<br\\s*/?>\\s*([^<]+)", Pattern.CASE_INSENSITIVE).matcher(rowHtml);
                if (timeMatcher.find()) time = cleanText(timeMatcher.group(1));

                String fare = "0";
                Matcher fareMatcher = Pattern.compile("(?:₦|NGN)\\s*([\\d,]+)", Pattern.CASE_INSENSITIVE).matcher(rowHtml);
                if (fareMatcher.find()) fare = fareMatcher.group(1).replace(",", "").trim();

                String seatsAvailable = "0";
                Matcher seatMatcher = Pattern.compile("(\\d+)\\s*seats?\\s*available", Pattern.CASE_INSENSITIVE).matcher(rowHtml);
                if (seatMatcher.find()) seatsAvailable = seatMatcher.group(1).trim();

                if (!tripId.isEmpty()) {
                    JSONObject trip = new JSONObject();
                    trip.put("TripId", tripId);
                    trip.put("Route", route);
                    trip.put("Coach", busType);
                    trip.put("Type", busType);
                    trip.put("Departure", time);
                    trip.put("Duration", "");
                    trip.put("Boarding", "");
                    trip.put("Fare", fare);
                    trip.put("Date", date);
                    trip.put("routeId", 0); // Plateau Riders doesn't use numeric route IDs in the same way
                    trips.add(trip);
                }
            }
        } catch (Exception e) {
            System.out.println("  ⚠️ Error scraping route: " + e.getMessage());
        }
        return trips;
    }

    private static JSONObject scrapeSeats(Page page, String tripId) {
        try {
            page.navigate(BASE_URL + "/bookings/select/seats/" + tripId);
            page.waitForLoadState();
            page.waitForTimeout(1000);

            String html = page.content();
            int capacity = 0;
            Matcher capMatcher = Pattern.compile("(\\d+)\\s*seater", Pattern.CASE_INSENSITIVE).matcher(html);
            if (capMatcher.find()) capacity = Integer.parseInt(capMatcher.group(1));

            Set<Integer> freeSeatNumbers = new HashSet<>();
            int maxSeatFound = 0;
            Matcher seatMatcher = Pattern.compile("<input[^>]*name=\"seats\\[\\]\"[^>]*value=\"(\\d+)\"", Pattern.CASE_INSENSITIVE).matcher(html);
            while (seatMatcher.find()) {
                int seatNum = Integer.parseInt(seatMatcher.group(1));
                freeSeatNumbers.add(seatNum);
                if (seatNum > maxSeatFound) maxSeatFound = seatNum;
            }

            if (capacity == 0) {
                capacity = maxSeatFound > 7 ? 14 : (maxSeatFound > 0 ? 7 : 0);
            }

            JSONArray seatsArray = new JSONArray();
            List<String> seatStatusList = new ArrayList<>();

            for (int i = 1; i <= capacity; i++) {
                boolean isFree = freeSeatNumbers.contains(i);
                seatStatusList.add(i + ":" + (isFree ? "FREE" : "BOOKED"));
                JSONObject s = new JSONObject();
                s.put("number", i);
                s.put("status", isFree ? "free" : "booked");
                seatsArray.put(s);
            }

            JSONObject result = new JSONObject();
            result.put("Capacity", capacity);
            result.put("AvailableSeats", freeSeatNumbers.size());
            result.put("SeatsArray", seatsArray);
            result.put("SeatMapText", formatSeatMap(seatStatusList));
            return result;

        } catch (Exception e) {
            return null;
        }
    }

    // ─────────────── Helpers ───────────────

    private static String formatSeatMap(List<String> seats) {
        if (seats == null || seats.isEmpty()) return "(Seat map unavailable)";
        Set<String> booked = new HashSet<>();
        for (String s : seats) if (s.endsWith(":BOOKED")) booked.add(s.split(":")[0]);
        StringBuilder sb = new StringBuilder();
        int total = seats.size();

        if (total == 14) {
            sb.append("[Driver] [").append(booked.contains("1") ? " 1*" : " 1").append("] [").append(booked.contains("2") ? " 2*" : " 2").append("]\n");
            sb.append("[").append(booked.contains("3") ? " 3*" : " 3").append("] [").append(booked.contains("4") ? " 4*" : " 4").append("] [").append(booked.contains("5") ? " 5*" : " 5").append("]\n");
            sb.append("[").append(booked.contains("6") ? " 6*" : " 6").append("] [").append(booked.contains("7") ? " 7*" : " 7").append("] [").append(booked.contains("8") ? " 8*" : " 8").append("]\n");
            sb.append("[").append(booked.contains("9") ? " 9*" : " 9").append("] [").append(booked.contains("10") ? "10*" : "10").append("] [").append(booked.contains("11") ? "11*" : "11").append("]\n");
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

    private static int uploadTrip(JSONObject trip, String apiKey, String workerOrigin) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(WORKER_URL).openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setConnectTimeout(20000);
        c.setReadTimeout(20000);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("x-api-key", apiKey);
        c.setRequestProperty("Origin", workerOrigin);

        OutputStream os = c.getOutputStream();
        os.write(trip.toString().getBytes("UTF-8"));
        os.close();

        int code = c.getResponseCode();
        c.disconnect();
        return code;
    }

    private static String cleanText(String s) {
        return s == null ? "" : s.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private static String getEnv(String key, String fallback) {
        String v = System.getenv(key);
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    static class Destination {
        String id, name;
        Destination(String id, String name) { this.id = id; this.name = name; }
    }
}
