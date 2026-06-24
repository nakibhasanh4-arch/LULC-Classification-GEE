/********************************************************
 Proper GEE code for ArcMap using ESA WorldCover
 Final classes:
 0 = NoData / Background
 2 = Water
 3 = Soil / Barren land
 4 = Vegetation
 5 = Agriculture
 6 = Urban / Built-up
********************************************************/

// ===============================
// 1. Load ROI
// ===============================
var roi = ee.FeatureCollection('projects/peaceful-crane-486406-v9/assets/Export_Output');
Map.centerObject(roi, 10);
Map.addLayer(roi, {color: 'red'}, 'ROI');

// ===============================
// 2. Load ESA WorldCover
// v200 classes:
// 10 Tree cover
// 20 Shrubland
// 30 Grassland
// 40 Cropland
// 50 Built-up
// 60 Bare/sparse vegetation
// 70 Snow and ice
// 80 Permanent water bodies
// 90 Herbaceous wetland
// 95 Mangroves
// 100 Moss and lichen
// ===============================
var worldcover = ee.ImageCollection('ESA/WorldCover/v200')
  .first()
  .select('Map')
  .clip(roi);

Map.addLayer(worldcover, {}, 'Original WorldCover');

// ===============================
// 3. Remap to your required classes
//
// ESA -> Final
// 80  -> 2  Water
// 60  -> 3  Soil / Barren land
// 10  -> 4  Vegetation
// 20  -> 4  Vegetation
// 30  -> 4  Vegetation
// 90  -> 4  Vegetation
// 95  -> 4  Vegetation
// 100 -> 4  Vegetation
// 40  -> 5  Agriculture
// 50  -> 6  Urban / Built-up
//
// Others -> 0
// ===============================
var lulc = worldcover.remap(
  [80, 60, 10, 20, 30, 90, 95, 100, 40, 50],
  [ 2,  3,  4,  4,  4,  4,  4,   4,  5,  6],
  0
).rename('LULC').toByte();

// ===============================
// 4. Check values before export
// ===============================
var histogram = lulc.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: roi.geometry(),
  scale: 10,
  maxPixels: 1e13
});
print('Histogram of final classes:', histogram);

// ===============================
// 5. Display in GEE
// ===============================
var palette = [
  '0000FF', // 2 Water
  'D2B48C', // 3 Soil / Barren land
  '32CD32', // 4 Vegetation
  'FFFF00', // 5 Agriculture
  'FF0000'  // 6 Urban / Built-up
];

// For display only, use min/max of existing class range
Map.addLayer(lulc, {
  min: 2,
  max: 6,
  palette: palette
}, 'Final LULC');

// ===============================
// 6. Export to Drive for ArcMap
// ===============================
Export.image.toDrive({
  image: lulc.unmask(0).toByte(),
  description: 'LULC_ESA_WorldCover_ArcMap',
  folder: 'GEE_Export',
  fileNamePrefix: 'LULC_ESA_WorldCover_ArcMap',
  region: roi.geometry(),
  scale: 10,
  crs: 'EPSG:32614',
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});
