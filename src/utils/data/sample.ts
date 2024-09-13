const selectedMeasurementValues = Array.from({ length: 48 }, () => Math.floor(Math.random() * 8 + 2) * 15);
const selectedMeasurementCoords = Array.from({ length: 48 }, (_, index) => ({
  x: index,
  y: Math.floor(Math.random() * 8 + 2) * 15,
}));

export {
  selectedMeasurementValues,
  selectedMeasurementCoords,
}