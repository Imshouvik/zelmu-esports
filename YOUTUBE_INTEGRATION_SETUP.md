# YouTube Integration Setup for ZELMU App

This guide will help you set up the YouTube integration to display live streams and videos from the ZELMU YouTube channel.

## Prerequisites

1. **YouTube Data API v3 Key**: You need a Google Cloud Project with YouTube Data API v3 enabled
2. **ZELMU Channel ID**: The YouTube channel ID for ZELMU

## Setup Steps

### 1. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Get ZELMU Channel ID

1. Go to the ZELMU YouTube channel: https://www.youtube.com/@ZELMUESPORTS
2. Right-click and "View Page Source"
3. Search for "channelId" - it will look like: `"channelId":"UC1234567890"`
4. Copy the channel ID (the part after "channelId":" and before the closing quote)

### 3. Update Environment Variables

Create or update your `.env.local` file:

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 4. Update Channel ID

Edit `src/utils/youtube.ts` and replace the placeholder channel ID:

```typescript
const ZELMU_CHANNEL_ID = 'UC1234567890'; // Replace with actual ZELMU channel ID
```

### 5. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/youtube` in your app
3. You should see live streams (if any) and recent videos from the ZELMU channel

## Features

### Live Stream Integration
- ✅ **Real-time Detection**: Automatically detects when ZELMU goes live
- ✅ **Live Indicator**: Shows a pulsing "LIVE" indicator when streams are active
- ✅ **Viewer Count**: Displays current viewer count for live streams
- ✅ **Auto-refresh**: Updates every 30 seconds to check for new streams

### Video Gallery
- ✅ **Recent Videos**: Shows the latest 20 videos from the channel
- ✅ **Video Details**: Displays title, description, view count, and duration
- ✅ **Embedded Player**: Click any video to watch it directly in the app
- ✅ **Responsive Design**: Works on desktop and mobile devices

### User Experience
- ✅ **Authentication Required**: Only logged-in users can access content
- ✅ **Loading States**: Shows loading indicators while fetching data
- ✅ **Error Handling**: Gracefully handles API errors and network issues
- ✅ **Navigation Integration**: Added to main navigation menu

## API Endpoints

The integration creates these API routes:

- `GET /api/youtube/live` - Fetches current live streams
- `GET /api/youtube/videos` - Fetches recent videos
- `GET /api/youtube/video/[id]` - Fetches specific video details

## Customization

### Styling
- All components use Tailwind CSS classes
- Colors match the ZELMU brand (red for live streams, blue for videos)
- Responsive grid layouts for different screen sizes

### Content
- Videos are sorted by publish date (newest first)
- Live streams are prioritized and shown at the top
- Video descriptions are truncated to prevent layout issues

### Performance
- API calls are cached and rate-limited
- Live stream checks happen every 30 seconds
- Images are optimized with proper alt text

## Troubleshooting

### Common Issues

1. **No videos showing**: Check your API key and channel ID
2. **API quota exceeded**: YouTube API has daily limits, consider caching
3. **CORS errors**: Make sure your domain is allowed in Google Cloud Console
4. **Live streams not updating**: Check the refresh interval in the code

### Debug Mode

Add this to your `.env.local` for debugging:

```env
NEXT_PUBLIC_DEBUG_YOUTUBE=true
```

## Security Notes

- API key is exposed to the client (required for YouTube API)
- Consider implementing server-side caching for production
- Monitor API usage to stay within YouTube's quotas

## Production Deployment

1. Set environment variables in your hosting platform
2. Update the channel ID with the correct ZELMU channel
3. Test live stream detection
4. Monitor API usage and performance

## Support

For issues or questions about the YouTube integration, check:
- YouTube Data API documentation
- Google Cloud Console quotas and limits
- Network connectivity and CORS settings 