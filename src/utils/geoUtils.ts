// Utility functions for GPS-based live tracking calculations

export const SCHOOL_COORDINATE = { lat: 31.735500, lng: 44.605000, name: 'ثانوية أوائل غماس الأهلية 🏫' };

export const STOP_COORDINATE_LOOKUP: Record<string, { lat: number; lng: number }> = {
  // Ghammas default stops
  'مدرسة أم الربيعين الابتدائية': { lat: 31.7367231, lng: 44.6144858 },
  'مدرسة غماس الإبتدائية': { lat: 31.7367349, lng: 44.6042306 },
  'مدرسة الشهيد فيصل دلول': { lat: 31.7427235, lng: 44.6184886 },
  'مدرسة زنوبيا للبنات': { lat: 31.7345365, lng: 44.6023995 },
  'متوسطة ذو الفقار للبنين': { lat: 31.7348318, lng: 44.6010327 },
  'ثانوية غماس المسائية للبنين': { lat: 31.7350439, lng: 44.6001650 },
  'مدارس ابن عقيل الاهلية': { lat: 31.7346894, lng: 44.5999198 },
  // Baghdad fallback stops
  'مول المنصور': { lat: 31.8185, lng: 44.6050 },
  'ساحة النسور': { lat: 31.8210, lng: 44.6015 },
  'تقاطع الداودي': { lat: 31.8245, lng: 44.5930 },
  'منطقة اليرموك': { lat: 31.8110, lng: 44.6140 },
  'حي الحارثية': { lat: 31.8130, lng: 44.6090 },
  'جامعة بغداد': { lat: 31.8125, lng: 44.5980 },
};

// Haversine Distance Formula in Kilometers
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Retrieve coordinates for any stop name (dynamic fallback if not in lookup table)
export const getStopCoords = (stopName: string, index: number, totalStops: number): { lat: number; lng: number } => {
  const trimmed = stopName.trim();
  if (STOP_COORDINATE_LOOKUP[trimmed]) {
    return STOP_COORDINATE_LOOKUP[trimmed];
  }
  // Linear path fallback distribution leading to the school center
  const ratio = totalStops > 0 ? (index + 1) / (totalStops + 1) : 0.5;
  const startLat = 31.7220; // Southwest origin
  const startLng = 44.5820;
  return {
    lat: startLat + (SCHOOL_COORDINATE.lat - startLat) * ratio,
    lng: startLng + (SCHOOL_COORDINATE.lng - startLng) * ratio,
  };
};

export interface LiveTrackingResult {
  speed: number;
  distanceToSchool: string; // e.g. "4.2 كم"
  eta: string; // e.g. "12 دقيقة"
  currentStop: string;
  nextStop: string;
  stopsRemaining: number;
  progress: number; // 0.0 to 1.0
  status: 'stopped' | 'in_transit' | 'arrived_at_stop' | 'left_stop' | 'arrived_at_school';
}

// Full automated Live Tracking Engine
export const calculateLiveTracking = (
  currentLat: number,
  currentLng: number,
  stops: string[],
  speedKmh: number = 30
): LiveTrackingResult => {
  if (!stops || stops.length === 0) {
    const dist = calculateDistance(currentLat, currentLng, SCHOOL_COORDINATE.lat, SCHOOL_COORDINATE.lng);
    const etaMin = Math.max(1, Math.round((dist / 30) * 60)); // Assumes 30 km/h average
    const arrived = dist < 0.05;
    return {
      speed: arrived ? 0 : speedKmh,
      distanceToSchool: `${dist.toFixed(1)} كم`,
      eta: arrived ? "وصلت للمدرسة" : `${etaMin} دقيقة`,
      currentStop: arrived ? SCHOOL_COORDINATE.name : "في الطريق",
      nextStop: arrived ? "اكتملت الرحلة" : SCHOOL_COORDINATE.name,
      stopsRemaining: arrived ? 0 : 1,
      progress: arrived ? 1.0 : Math.max(0, Math.min(0.95, 1 - dist / 5)), // dynamic estimate
      status: arrived ? 'arrived_at_school' : (speedKmh > 0 ? 'in_transit' : 'stopped'),
    };
  }

  // Map stops to coordinates
  const stopsWithCoords = stops.map((name, idx) => ({
    name,
    coords: getStopCoords(name, idx, stops.length),
  }));

  // Calculate distance to school
  const distSchool = calculateDistance(currentLat, currentLng, SCHOOL_COORDINATE.lat, SCHOOL_COORDINATE.lng);

  // If extremely close to school (within 50 meters)
  if (distSchool < 0.05) {
    return {
      speed: 0,
      distanceToSchool: "0 كم",
      eta: "وصلت للمدرسة",
      currentStop: SCHOOL_COORDINATE.name,
      nextStop: "تم الوصول بنجاح",
      stopsRemaining: 0,
      progress: 1.0,
      status: 'arrived_at_school',
    };
  }

  // Find if within proximity of any stop (within 40 meters)
  let arrivedStopIndex = -1;
  for (let i = 0; i < stopsWithCoords.length; i++) {
    const dist = calculateDistance(currentLat, currentLng, stopsWithCoords[i].coords.lat, stopsWithCoords[i].coords.lng);
    if (dist < 0.04) {
      arrivedStopIndex = i;
      break;
    }
  }

  // Calculate distances to school for each stop to determine sequence
  const stopsDistToSchool = stopsWithCoords.map(s => 
    calculateDistance(s.coords.lat, s.coords.lng, SCHOOL_COORDINATE.lat, SCHOOL_COORDINATE.lng)
  );

  // Find which stops are "passed" (i.e. further from school than the current bus position)
  let passedCount = 0;
  for (let i = 0; i < stopsDistToSchool.length; i++) {
    if (stopsDistToSchool[i] > distSchool) {
      passedCount++;
    }
  }

  // Ensure passed count makes sense
  passedCount = Math.max(0, Math.min(stops.length, passedCount));

  // Determine current and next stop names
  let currentStop = 'محطة الانطلاق';
  let nextStop = SCHOOL_COORDINATE.name;

  if (passedCount > 0) {
    currentStop = stops[passedCount - 1];
  }
  if (passedCount < stops.length) {
    nextStop = stops[passedCount];
  }

  // If we are currently at a stop, override current/next stop to match perfectly
  let status: LiveTrackingResult['status'] = speedKmh > 0 ? 'in_transit' : 'stopped';
  if (arrivedStopIndex !== -1) {
    status = 'arrived_at_stop';
    currentStop = stops[arrivedStopIndex];
    nextStop = arrivedStopIndex < stops.length - 1 ? stops[arrivedStopIndex + 1] : SCHOOL_COORDINATE.name;
    passedCount = arrivedStopIndex + 1;
  }

  // Calculate timeline progress (from 0.0 to 1.0)
  // The line has (stops.length + 1) points (stops + school)
  const totalPoints = stops.length + 1;
  
  // Interpolate segment progress
  let segmentProgress = 0.5; // default center of segment
  if (arrivedStopIndex !== -1) {
    segmentProgress = 0; // exactly at the stop
  } else {
    // Determine the distance of current segment
    const startPoint = passedCount === 0 ? getStopCoords(stops[0], 0, stops.length) : getStopCoords(stops[passedCount - 1], passedCount - 1, stops.length);
    const endPoint = passedCount === stops.length ? SCHOOL_COORDINATE : getStopCoords(stops[passedCount], passedCount, stops.length);
    
    const segmentTotalDist = calculateDistance(startPoint.lat, startPoint.lng, endPoint.lat, endPoint.lng);
    const distToEnd = calculateDistance(currentLat, currentLng, endPoint.lat, endPoint.lng);
    
    if (segmentTotalDist > 0) {
      segmentProgress = Math.max(0, Math.min(0.99, 1 - distToEnd / segmentTotalDist));
    }
  }

  const progress = Math.max(0.01, Math.min(0.99, (passedCount + segmentProgress) / totalPoints));
  const stopsRemaining = totalPoints - passedCount;

  // Calculate ETA based on remaining distance and current speed
  const averageSpeed = speedKmh > 5 ? speedKmh : 25; // fallback to 25 km/h if stopped
  const etaMinutes = Math.max(1, Math.round((distSchool / averageSpeed) * 60));

  return {
    speed: speedKmh,
    distanceToSchool: `${distSchool.toFixed(1)} كم`,
    eta: `${etaMinutes} دقيقة`,
    currentStop,
    nextStop,
    stopsRemaining,
    progress,
    status,
  };
};
