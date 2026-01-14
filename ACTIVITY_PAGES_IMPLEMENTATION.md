# Activity Detail Pages with Flight Calculator

## Implementation Summary

I've successfully implemented individual activity pages with integrated flight calculators. Here's what was created:

## Features Implemented

### 1. **Individual Activity Pages**
- Each activity now has its own dedicated page at `/activity/{activity-id}.html`
- Pages are dynamically generated from the activities.json data
- 13 activity pages were created automatically

### 2. **Flight Calculator Component**
Located on each activity page with the following features:

- **Departure Airport Input**: Enter your departure city or airport code
- **Calendar Filter**: Select travel month with visual month buttons
  - Clicking a month automatically sets approximate departure/return dates
  - Visual feedback with active state highlighting
- **Date Filters**: Optional specific departure and return dates
- **"Find Me" Button**: Calculates and displays flight prices

### 3. **Flight Price Display**
When you click "Find Me Flights", the calculator shows:
- **Low Price**: Budget-friendly flight options
- **Average Price**: Most common price range
- **High Price**: Premium flight options
- Prices are estimated based on destination (domestic vs international)
- Direct link to Google Flights for actual booking

### 4. **Calendar Filtering**
The flight calculator includes a month-based calendar filter:
- 12 month buttons (Jan - Dec)
- Click to select a travel month
- Automatically populates departure/return dates
- Visual active state when a month is selected
- Deselect by clicking again

### 5. **Integration**
- Updated activities.html to link to individual activity pages instead of directly to affiliate URLs
- Added URL redirects for clean activity page URLs
- Activity pages maintain affiliate booking links
- Added to build process (runs automatically on deployment)

## File Structure

```
/workspaces/TradeTrends/
├── public/
│   ├── activity/
│   │   ├── activity-template.html (Main template)
│   │   ├── act-001.html (Paris tour)
│   │   ├── act-002.html (Tokyo food tour)
│   │   ├── act-003.html (NYC CityPASS)
│   │   ├── act-004.html (Barcelona Sagrada Familia)
│   │   ├── act-005.html (Dubai desert safari)
│   │   └── ... (9 more activity pages)
│   ├── activities.html (Updated to link to detail pages)
│   └── _redirects (Updated with activity routes)
├── scripts/
│   └── generate-activity-pages.js (Auto-generates pages)
└── package.json (Updated build script)
```

## How It Works

### User Flow:
1. User visits `/activities.html`
2. Clicks on any activity card (e.g., "Paris City Tour")
3. Redirected to `/activity/act-001.html?id=act-001`
4. Activity page loads with full details and flight calculator
5. User enters departure city
6. Optionally selects travel month from calendar
7. Clicks "Find Me Flights"
8. System displays low/average/high flight prices
9. User can click through to Google Flights for booking

### Technical Implementation:
- **Dynamic Loading**: Activity details load from activities.json via JavaScript
- **Airport Mapping**: Automatic airport code detection for major cities
- **Price Calculation**: Simulated pricing algorithm (domestic vs international)
- **Calendar Integration**: Month buttons auto-populate date fields
- **Responsive Design**: Works on all device sizes
- **Clean URLs**: SEO-friendly URLs like `/activity/act-001.html`

## Next Steps for Production

To use real flight data instead of estimates:
1. Integrate with Skyscanner API, Amadeus API, or Google Flights API
2. Replace the `calculateFlightPrices()` function with actual API calls
3. Add caching to reduce API costs
4. Consider adding more filters (class, airlines, stops)

## Testing

To test the implementation:
1. Run `npm run dev` or `netlify dev`
2. Navigate to http://localhost:8888/activities.html
3. Click on any activity card
4. Test the flight calculator with different departure cities
5. Try the calendar month filter
6. Verify price display and Google Flights link

All files have been created and the system is ready for deployment!
