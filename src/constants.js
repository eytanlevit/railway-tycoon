// Cut/paste from reference-design.html lines 52-88

export const MAP_COLS = 25; 
export const MAP_ROWS = 25; 
export const TILE_WIDTH_HALF = 32; 
export const TILE_HEIGHT_HALF = 16; 

export const COLORS = {
    grass: '#8BC34A', water: '#03A9F4', sand: '#FFC107',
    cityGround: '#BDBDBD', cityWall1: '#795548', cityRoof1: '#A1887F',
    cityWall2: '#8D6E63', cityRoof2: '#BCAAA4', cityWall3: '#6D4C41', cityRoof3: '#90A4AE', 
    track: '#5D4037', trackTies: '#8D6E63', 
    trainEngine: '#D32F2F', trainCarriage: '#F44336', trainHighlight: '#FFCDD2',
    smokestack: '#424242', trainShadow: 'rgba(0, 0, 0, 0.25)', 
    cowcatcher: '#616161', 
    mountain: '#795548', mountainSnow: '#E0E0E0', 
    forestTrunk: '#5D4037', forestCanopy: '#388E3C',
    sky: '#87CEEB', cityNameText: '#212121', cityNameBackground: 'rgba(255, 255, 255, 0.7)',
};

export const TILE_TYPE = { GRASS: 0, WATER: 1, SAND: 2, CITY: 3, MOUNTAIN: 4, FOREST: 5 };

export const CITY_NAMES = [
    "Springfield", "Riverside", "Oakdale", "Fairview", "Madison", "Georgetown", "Arlington", "Salem",
    "Greenville", "Franklin", "Clinton", "Bristol", "Dover", "Manchester", "Chester", "Milton",
    "Auburn", "Bedford", "Burlington", "Clayton", "Dayton", "Harrison", "Jackson", "Lexington"
]; 

// No window exports here - main.js will handle that