# Social Sharing Feature

## Overview
Added comprehensive social sharing functionality to all deal cards across products, travel, and activities pages. The feature ensures affiliate links are always included to preserve purchase attribution.

## Features

### Supported Platforms
- **Facebook** - Share to Facebook feed
- **X (Twitter)** - Tweet with deal link
- **Messenger** - Share via Facebook Messenger
- **Pinterest** - Pin with image and description
- **WhatsApp** - Share via WhatsApp
- **Copy Link** - Copy affiliate link to clipboard

### Key Benefits
✅ **Affiliate Link Protection** - All shared links use your affiliate URLs to ensure you get credit for purchases
✅ **Multi-Platform** - Share to all major social networks
✅ **Mobile Optimized** - Responsive design for mobile and desktop
✅ **Easy to Use** - Single click share button with popup menu
✅ **Analytics Ready** - Tracks share events for analytics (if gtag is configured)

## Implementation Details

### Files Modified

1. **`/public/js/render.js`**
   - Added share button HTML to each card
   - Implemented share menu with all social platforms
   - Added event listeners for share actions
   - Implemented copy-to-clipboard functionality
   - Added analytics tracking for share events

2. **`/public/css/styles.css`**
   - Added styling for share button
   - Added share menu dropdown styling
   - Platform-specific hover effects (Facebook blue, Twitter blue, etc.)
   - Mobile-responsive positioning
   - Smooth animations and transitions

### How It Works

1. **Share Button** - Each deal card has a "Share" button next to the main CTA
2. **Share Menu** - Clicking opens a popup menu with all sharing options
3. **Affiliate Links** - All share options use the deal's `affiliate_url` to ensure credit
4. **Platform URLs** - Constructs proper sharing URLs for each platform:
   - Facebook: Uses sharer API
   - Twitter: Uses intent/tweet API
   - Messenger: Uses fb-messenger:// protocol
   - Pinterest: Includes image and description
   - WhatsApp: Uses wa.me API
5. **Copy Link** - Supports modern clipboard API with fallback for older browsers

### Affiliate Link Flow

```
Deal Card → affiliate_url (e.g., https://amzn.to/xyz123)
    ↓
Share Button Clicked
    ↓
Share Menu Opens
    ↓
User Selects Platform (e.g., Facebook)
    ↓
Platform receives affiliate_url in share
    ↓
User's followers click shared link
    ↓
Traffic goes directly to affiliate_url
    ↓
You get credit for any purchases! 💰
```

## Usage

### For Users
1. Browse any deal on Amazon, Travel, or Activities pages
2. Click the "Share" button on any deal card
3. Choose a platform to share
4. The deal is shared with your affiliate link included

### For Admins
No additional configuration needed. The feature works automatically with existing deal data. Just ensure each deal has a valid `affiliate_url` field.

## Instagram Note
Instagram doesn't support direct web-based URL sharing. The "Copy Link" option is the best way to share on Instagram - users can copy the link and paste it into their Instagram Story or bio.

## Mobile Optimization
- Share menu is fixed at bottom on mobile devices (< 620px width)
- Full-width for easy touch interaction
- Optimized button sizes for mobile taps

## Browser Support
- Modern browsers: Full clipboard API support
- Older browsers: Fallback copy method using execCommand
- All major mobile browsers supported

## Analytics Integration
If Google Analytics (gtag) is configured, the feature automatically tracks:
- Share events by platform
- Deal type (amazon/travel/activities)
- Deal title

## Customization

### Adding New Platforms
To add a new sharing platform, edit `/public/js/render.js`:

```javascript
// Add new share URL
const newPlatformShare = `https://newplatform.com/share?url=${shareUrl}`;

// Add to share menu HTML
<a href="${newPlatformShare}" target="_blank" rel="noopener" class="share-option newplatform">
  <svg>...</svg>
  New Platform
</a>
```

Then add platform-specific styling in `/public/css/styles.css`:

```css
.share-option.newplatform:hover{
  border-color: rgba(R,G,B,.5);
  background: linear-gradient(90deg, rgba(R,G,B,.1), rgba(R,G,B,.05));
}
```

### Styling Adjustments
All share-related styles are in `/public/css/styles.css` under the "Share button styling" section.

## Testing

Test the sharing feature:
1. Open any page with deals (index.html, amazon.html, travel.html, activities.html)
2. Click "Share" on any deal card
3. Verify share menu appears
4. Test each platform link (they should open in new tabs)
5. Test "Copy Link" - verify it copies the affiliate URL
6. Test on mobile devices - verify responsive behavior

## Troubleshooting

**Share menu not appearing:**
- Check browser console for JavaScript errors
- Verify render.js is loading correctly

**Copy Link not working:**
- Modern browsers require HTTPS for clipboard API
- Fallback method will be used on HTTP or older browsers

**Share links not working:**
- Verify each deal has a valid `affiliate_url` in the JSON data
- Check URL encoding is correct

## Future Enhancements
- Add LinkedIn sharing
- Add Reddit sharing
- Add email sharing option
- Track which platforms generate the most clicks
- A/B test share button placement
- Add share count indicators
