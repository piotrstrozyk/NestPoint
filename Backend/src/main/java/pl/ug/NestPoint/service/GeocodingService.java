package pl.ug.NestPoint.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.net.URI;
import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.UriComponentsBuilder;
import pl.ug.NestPoint.domain.Address;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeocodingService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public void geocodeAddress(Address address) {
        if (address == null || address.getCity() == null || address.getStreet() == null) {
            log.warn("Cannot geocode incomplete address");
            return;
        }
        
        try {
            String addressString = String.join(", ",
                (address.getStreet() + " " + (address.getApartmentNumber() != null ? address.getApartmentNumber() : "")).trim(),
                address.getCity(),
                address.getCountry() != null ? address.getCountry() : ""
            ).replaceAll(",\\s*,", ",").replaceAll("\\s+", " ").trim();

            // build the URI
            URI uri = UriComponentsBuilder
                    .fromUriString("https://nominatim.openstreetmap.org/search")
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .queryParam("street", address.getStreet())
                    .queryParam("city", address.getCity())
                    .queryParam("postcode", address.getPostalCode())
                    .queryParam("country", address.getCountry())
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            log.info("Making geocoding request to: {}", uri);
            
            // Required User-Agent header
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "NestPoint-App/1.0");
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "pl");

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                uri,
                HttpMethod.GET, 
                entity, 
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                log.info("Response body: {}", response.getBody());
                
                if (root.isArray() && root.size() > 0) {
                    JsonNode firstResult = root.get(0);
                    
                    // Make sure to parse string values properly
                    String latString = firstResult.get("lat").asText();
                    String lonString = firstResult.get("lon").asText();
                    
                    double lat = Double.parseDouble(latString);
                    double lon = Double.parseDouble(lonString);
                    
                    address.setLatitude(lat);
                    address.setLongitude(lon);
                    
                    log.info("COORDINATES SET: lat={}, lon={}", lat, lon);
                    log.info("ADDRESS OBJECT AFTER SETTING: {}", address);
                } else {
                    log.warn("No geocoding results found for address: {}", addressString);
                }
            } else {
                log.error("Error geocoding address: {}, response: {}", addressString, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Exception while geocoding address", e);
            e.printStackTrace();
        }
    }
    public ObjectNode reverseGeocode(Address address) {
        if (address == null || address.getLatitude() == null || address.getLongitude() == null) {
            log.warn("Cannot reverse-geocode without coordinates");
            return null;
        }

        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://nominatim.openstreetmap.org/reverse")
                    .queryParam("format", "json")
                    .queryParam("lat", address.getLatitude())
                    .queryParam("lon", address.getLongitude())
                    .queryParam("addressdetails", 1)      // structured address
                    .queryParam("polygon_geojson", 1)     // full GeoJSON geometry :contentReference[oaicite:1]{index=1}
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            log.info("Making reverse-geocoding+geojson request to: {}", uri);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "NestPoint-App/1.0");
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "pl");

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> resp = restTemplate.exchange(
                    uri, HttpMethod.GET, entity, String.class
            );

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.error("Reverse-geocode failed: {} → {}", address, resp.getStatusCode());
                return null;
            }

            JsonNode root = objectMapper.readTree(resp.getBody());
            log.debug("Reverse+GeoJSON response: {}", resp.getBody());

            // populate structured Address
            JsonNode addr = root.path("address");
            address.setStreet(addr.path("road").asText(null));
            address.setApartmentNumber(addr.path("house_number").asText(null));
            address.setCity(
                    addr.path("city").asText(
                            addr.path("town").asText(
                                    addr.path("village").asText(null)))
            );
            address.setPostalCode(addr.path("postcode").asText(null));
            address.setCountry(addr.path("country").asText(null));

            // extract the GeoJSON geometry
            JsonNode geojson = root.path("geojson");

            // build a two‐field result
            ObjectNode result = objectMapper.createObjectNode();
            result.set("address", objectMapper.valueToTree(address));
            result.set("geojson", geojson);

            log.info("Reverse‐geocoded Address + GeoJSON ready");
            return result;

        } catch (Exception e) {
            log.error("Exception during reverse‐geocoding+geojson", e);
            return null;
        }
    }
}
