# models/geofence.py
import math

class GeofenceValidator:

    # ── HAVERSINE DISTANCE FORMULA ─────────────────────────────
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """
        Calculate real-world distance between two GPS coordinates
        using the Haversine formula.

        Returns distance in meters.

        Why Haversine:
        Simple subtraction of coordinates ignores Earth's curvature.
        Haversine accounts for the spherical shape of Earth
        giving accurate distances up to a few hundred km.
        """
        R = 6371000  # Earth radius in meters

        # Convert decimal degrees to radians
        phi1    = math.radians(lat1)
        phi2    = math.radians(lat2)
        d_phi   = math.radians(lat2 - lat1)
        d_lam   = math.radians(lng2 - lng1)

        # Haversine formula
        a = (math.sin(d_phi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(d_lam / 2) ** 2)

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c

        return round(distance, 2)  # meters, rounded to 2 decimal places

    # ── CHECK SINGLE GEOFENCE ──────────────────────────────────
    def check_single_fence(self, user_lat, user_lng, fence):
        """
        Check if user is inside a single geofence
        
        fence = {
            name: str,
            center: { lat: float, lng: float },
            radius: float (meters),
            isActive: bool
        }
        """
        distance = self.calculate_distance(
            user_lat, user_lng,
            fence['center']['lat'],
            fence['center']['lng']
        )

        is_inside = distance <= fence['radius']

        return {
            'fence_name':     fence.get('name', 'Unknown'),
            'is_inside':      is_inside,
            'distance':       distance,
            'allowed_radius': fence['radius'],
            'excess_meters':  round(max(0, distance - fence['radius']), 2)
        }

    # ── VALIDATE AGAINST ALL GEOFENCES ─────────────────────────
    def validate_location(self, user_lat, user_lng, geofences):
        """
        Validate user location against list of geofences.
        User passes if inside ANY active geofence.

        geofences = [
            {
                name: "Main Campus",
                center: { lat: 29.3956, lng: 71.6722 },
                radius: 100,
                isActive: True
            }
        ]
        """
        # No geofences configured at all
        if not geofences:
            return {
                'valid':         False,
                'reason':        'No geofences configured. Contact admin.',
                'nearest_fence': None,
                'all_results':   []
            }

        # Filter only active geofences
        active_fences = [f for f in geofences if f.get('isActive', True)]

        if not active_fences:
            return {
                'valid':         False,
                'reason':        'No active geofences. Contact admin.',
                'nearest_fence': None,
                'all_results':   []
            }

        # Check each active geofence
        results = []
        for fence in active_fences:
            result = self.check_single_fence(user_lat, user_lng, fence)
            results.append(result)
            print(f"  {fence['name']}: {result['distance']}m "
                  f"(limit: {fence['radius']}m) "
                  f"→ {'✅ INSIDE' if result['is_inside'] else '❌ OUTSIDE'}")

        # Sort by distance — nearest fence first
        results.sort(key=lambda x: x['distance'])
        nearest = results[0]

        # Pass if inside any fence
        inside_fence = next((r for r in results if r['is_inside']), None)

        if inside_fence:
            return {
                'valid':         True,
                'reason':        f"Inside {inside_fence['fence_name']} "
                                 f"({inside_fence['distance']}m from center)",
                'distance':      inside_fence['distance'],
                'fence_name':    inside_fence['fence_name'],
                'nearest_fence': nearest,
                'all_results':   results
            }

        # Failed — outside all geofences
        return {
            'valid':         False,
            'reason':        (f"You are {nearest['distance']}m from "
                              f"{nearest['fence_name']}. "
                              f"Allowed radius: {nearest['allowed_radius']}m. "
                              f"You need to be {nearest['excess_meters']}m closer."),
            'nearest_fence': nearest,
            'all_results':   results
        }