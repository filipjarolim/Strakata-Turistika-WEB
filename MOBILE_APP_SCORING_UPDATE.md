# Mobile App Scoring System Update Prompt

## Context
The web application has been updated with a new scoring configuration system. The mobile Flutter app needs to be updated to match the web implementation.

## Current Web Implementation

### Single ScoringConfig
- **CRITICAL**: There is only ONE scoring config in the database (identified by `active: true`)
- The config ID is always the same across all users
- No user-specific or multiple configs are allowed

### Current Configuration Values

```json
{
  "id": "default_scoring_config",
  "pointsPerKm": 2.0,
  "minDistanceKm": 3.0,
  "requireAtLeastOnePlace": true,
  "placeTypePoints": {
    "PEAK": 1.0,
    "TOWER": 1.0,
    "TREE": 1.0,
    "OTHER": 0.0
  },
  "active": true
}
```

### API Endpoint
```
GET /api/scoring-config
```
**Returns**: Single scoring config object (not an array)

**Response Format:**
```json
{
  "id": "default_scoring_config",
  "pointsPerKm": 2.0,
  "minDistanceKm": 3.0,
  "requireAtLeastOnePlace": true,
  "placeTypePoints": {
    "PEAK": 1.0,
    "TOWER": 1.0,
    "TREE": 1.0,
    "OTHER": 0.0
  },
  "active": true
}
```

## Required Changes for Mobile App

### 1. Scoring Config Model
Update your Flutter model to match:
```dart
class ScoringConfig {
  final String id;
  final double pointsPerKm;
  final double minDistanceKm;
  final bool requireAtLeastOnePlace;
  final Map<String, double> placeTypePoints;
  final bool active;

  ScoringConfig({
    required this.id,
    required this.pointsPerKm,
    required this.minDistanceKm,
    required this.requireAtLeastOnePlace,
    required this.placeTypePoints,
    required this.active,
  });

  factory ScoringConfig.fromJson(Map<String, dynamic> json) {
    return ScoringConfig(
      id: json['id'],
      pointsPerKm: (json['pointsPerKm'] as num).toDouble(),
      minDistanceKm: (json['minDistanceKm'] as num).toDouble(),
      requireAtLeastOnePlace: json['requireAtLeastOnePlace'] as bool,
      placeTypePoints: Map<String, double>.from(
        json['placeTypePoints'] as Map
      ),
      active: json['active'] as bool,
    );
  }
}
```

### 2. API Service Update
Change the API call to expect a single object, not an array:

**Before (incorrect):**
```dart
List<ScoringConfig> configs = await api.fetchScoringConfigs();
ScoringConfig config = configs.first;
```

**After (correct):**
```dart
ScoringConfig config = await api.fetchScoringConfig();
```

### 3. Calculation Logic
Update point calculation to match web:

```dart
double calculatePoints({
  required double distanceKm,
  required List<Place> places,
  required ScoringConfig config,
}) {
  // Distance points
  double distancePoints = 0.0;
  if (distanceKm >= config.minDistanceKm) {
    distancePoints = distanceKm * config.pointsPerKm;
  }
  
  // Place points
  double placePoints = 0.0;
  for (var place in places) {
    double? points = config.placeTypePoints[place.type];
    if (points != null) {
      placePoints += points;
    }
  }
  
  // Total points
  double totalPoints = 0.0;
  if (config.requireAtLeastOnePlace) {
    if (places.isNotEmpty) {
      totalPoints = distancePoints + placePoints;
    }
  } else {
    totalPoints = distancePoints + placePoints;
  }
  
  // Round down to 1 decimal place
  return (totalPoints * 10).floor() / 10;
}
```

### 4. Place Type Points Update
The placeTypePoints now have these default values:
- **PEAK**: 1.0 point
- **TOWER**: 1.0 point  
- **TREE**: 1.0 point
- **OTHER**: 0.0 points

## Testing Checklist
- [ ] API returns single ScoringConfig object (not array)
- [ ] ScoringConfig model matches new structure
- [ ] Point calculation matches web logic
- [ ] Place type points are correctly applied (PEAK=1, TOWER=1, TREE=1, OTHER=0)
- [ ] requireAtLeastOnePlace flag is properly used
- [ ] Points are rounded down to 1 decimal place

## API Testing
Use this curl command to test:
```bash
curl -H "Content-Type: application/json" \
  https://your-web-app.com/api/scoring-config
```

Expected response: Single JSON object (not array)

## Breaking Changes
- Old system may have returned configs as an array
- New system always returns a single config object
- placeTypePoints values changed from 5/3/2/1 to 1/1/1/0
- Configuration is now centrally managed on web admin
