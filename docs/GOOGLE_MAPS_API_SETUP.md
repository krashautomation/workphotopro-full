# Google Maps API Setup Guide

## 📚 **Best Resources & Guides**

### **1. Official Documentation & Tutorials**
- **[React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)** - Official GitHub repo with comprehensive setup guides
- **[Expo Google Maps Guide](https://docs.expo.dev/versions/latest/sdk/map-view/)** - Official Expo documentation for maps
- **[Google Cloud Console](https://console.cloud.google.com/)** - Where you get your API key

### **2. Step-by-Step Video Tutorials**
- **[React Native Maps Tutorial by Programming with Mash](https://www.youtube.com/watch?v=qdXz5T2uUKE)** - Complete setup walkthrough
- **[Google Maps API Setup Tutorial](https://www.youtube.com/watch?v=ZnJcHxDbk0s)** - API key configuration
- **[Expo Maps Integration](https://www.youtube.com/watch?v=0yXJ4N6Xk1c)** - Expo-specific implementation

### **3. Written Tutorials**
- **[FreeCodeCamp React Native Maps Guide](https://www.freecodecamp.org/news/how-to-integrate-maps-in-react-native-using-react-native-maps/)**
- **[Medium Tutorial: Google Maps in React Native](https://medium.com/@reactnative/implementing-google-maps-in-react-native-7b4a2b1a0b8a)**

## 🚀 **Quick Setup Steps for Your Project**

### **Step 1: Install Dependencies**
```bash
# For Expo projects
expo install react-native-maps

# For bare React Native projects  
npm install react-native-maps
```

### **Step 2: Get Google Maps API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API (for address lookup)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Restrict the key to your app's bundle ID

### **Step 3: Configure for Expo**
Since you're using Expo, add to your `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ]
  }
}
```

### **Step 4: Update Your ShareLocation Component**
Replace your current map placeholder with a real MapView:

```jsx
import MapView, { Marker } from 'react-native-maps';

// In your component:
<MapView
  style={{ height: 200, borderRadius: 12 }}
  initialRegion={{
    latitude: location?.latitude || 37.78825,
    longitude: location?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
  showsUserLocation={true}
>
  {location && (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      title="Your Location"
    />
  )}
</MapView>
```

## 🎯 **Recommended Learning Path**

1. **Start with**: [Expo Maps Documentation](https://docs.expo.dev/versions/latest/sdk/map-view/)
2. **Watch**: [Programming with Mash YouTube tutorial](https://www.youtube.com/watch?v=qdXz5T2uUKE)
3. **Follow**: [FreeCodeCamp written guide](https://www.freecodecamp.org/news/how-to-integrate-maps-in-react-native-using-react-native-maps/)
4. **Practice**: Implement in your existing ShareLocation component

## 📝 **Implementation Notes**

### **Current ShareLocation Component**
- Located at: `components/share-location.tsx`
- Currently uses a programmatic map placeholder
- Ready to be upgraded with real Google Maps integration

### **Key Features to Implement**
- Real map display with user location
- Interactive map with zoom/pan
- Location marker with custom styling
- Address geocoding for location names

### **Permissions Required**
- Location access permissions (already handled with expo-location)
- Camera permissions (if taking location photos)
- Network permissions (for map tiles)

The key is getting the Google Maps API key first, then the rest is straightforward configuration!
