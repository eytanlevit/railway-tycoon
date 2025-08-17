import { MAP_COLS, MAP_ROWS, TILE_TYPE, COLORS, CITY_NAMES, TILE_WIDTH_HALF, TILE_HEIGHT_HALF } from './constants.js';
import { seededRandom, isoToScreen } from './utils.js';
import { aStar, validatePathSegment } from './pathfinding.js';

// Cut/paste global variables from lines 79-90
export let mapData = []; 
export let featureLayouts = {}; 
export let placedCitiesCoords = []; 
export let availableCityNames = [...CITY_NAMES];
export let trainPath = [];

// Cut/paste generateMap from lines 692-770 EXACTLY
export function generateMap() {
    // Clear arrays in place instead of reassigning
    mapData.length = 0; 
    Object.keys(featureLayouts).forEach(key => delete featureLayouts[key]);
    availableCityNames.length = 0;
    availableCityNames.push(...CITY_NAMES);
    placedCitiesCoords.length = 0;
    // 1. Generate terrain
    for(let r=0;r<MAP_ROWS;r++){mapData[r]=[];for(let c=0;c<MAP_COLS;c++){
        let t=TILE_TYPE.WATER;const rF=seededRandom(c,r,300);const dX=Math.abs(c-MAP_COLS/2);const dY=Math.abs(r-MAP_ROWS/2);
        const nX=dX/(MAP_COLS/2.5);const nY=dY/(MAP_ROWS/2.5);const iF=Math.sqrt(nX*nX+nY*nY);
        if(iF<0.8){t=TILE_TYPE.GRASS;if(rF<0.15)t=TILE_TYPE.FOREST;else if(rF<0.25&&iF<0.7)t=TILE_TYPE.MOUNTAIN;}
        else if(iF<1.0)t=TILE_TYPE.SAND;
        const lR=seededRandom(c,r,301);if(((c>MAP_COLS*0.15&&c<MAP_COLS*0.35&&r>MAP_ROWS*0.15&&r<MAP_ROWS*0.35&&lR>0.7)||(c>MAP_COLS*0.65&&c<MAP_COLS*0.85&&r>MAP_ROWS*0.65&&r<MAP_ROWS*0.85&&lR>0.7)))t=(lR>0.85)?TILE_TYPE.WATER:TILE_TYPE.SAND;
        mapData[r][c]=t;
    }}
    // 2. Place cities & pre-generate their visual layouts
    let cP=0;const mC=Math.floor((MAP_ROWS*MAP_COLS)/100)+2; 
    for(let att=0;att<2000 && cP<mC;att++){ 
        const rA=Math.floor(seededRandom(att,att*2,400)*(MAP_ROWS-2))+1;const cA=Math.floor(seededRandom(att*2,att,401)*(MAP_COLS-2))+1;
        if(rA>=0&&rA<MAP_ROWS&&cA>=0&&cA<MAP_COLS&&mapData[rA][cA]===TILE_TYPE.GRASS){
            let suit=true;
            for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){
                const nr=rA+dr; const nc=cA+dc;
                if(nr>=0&&nr<MAP_ROWS&&nc>=0&&nc<MAP_COLS){ if(mapData[nr][nc]===TILE_TYPE.WATER||mapData[nr][nc]===TILE_TYPE.MOUNTAIN||mapData[nr][nc]===TILE_TYPE.FOREST||(mapData[nr][nc]===TILE_TYPE.CITY && !(dr===0 && dc===0))){suit=false;break;}} else { suit=false;break; }}if(!suit)break;}
            if(suit){
                mapData[rA][cA]=TILE_TYPE.CITY;cP++;
                const cityKey=`city-${cA}-${rA}`;
                featureLayouts[cityKey]={ buildings: [], name: '' }; 

                let cN=`Town ${cP}`;if(availableCityNames.length>0){const nI=Math.floor(Math.random()*availableCityNames.length);cN=availableCityNames.splice(nI,1)[0];}
                featureLayouts[cityKey].name=cN;
                placedCitiesCoords.push({x:cA,y:rA,name:cN});
                
                const { x: tcX_city, y: tcY_city } = isoToScreen(cA, rA);
                const numB = 8 + Math.floor(seededRandom(cA, rA, 1) * 5);
                for (let i = 0; i < numB; i++) {
                    const bSeed=i*10; const oX=(seededRandom(cA,rA,bSeed+1)-0.5)*TILE_WIDTH_HALF*0.8; const oY=(seededRandom(cA,rA,bSeed+2)-0.5)*TILE_HEIGHT_HALF*0.6;
                    const bWH=TILE_WIDTH_HALF*(0.15+seededRandom(cA,rA,bSeed+3)*0.15); const bDH=TILE_HEIGHT_HALF*(0.15+seededRandom(cA,rA,bSeed+4)*0.15);
                    const bH=TILE_HEIGHT_HALF*(0.8+seededRandom(cA,rA,bSeed+5)*0.7); const cSeed=Math.floor(seededRandom(cA,rA,bSeed+6)*3);
                    let wc,rc;if(cSeed===0){wc=COLORS.cityWall1;rc=COLORS.cityRoof1;}else if(cSeed===1){wc=COLORS.cityWall2;rc=COLORS.cityRoof2;}else{wc=COLORS.cityWall3;rc=COLORS.cityRoof3;}
                    featureLayouts[cityKey].buildings.push({offsetX:oX,offsetY:oY,buildingWidthHalf:bWH,buildingDepthHalf:bDH,buildingHeight:bH,wallColor:wc,roofColor:rc});
                }
                featureLayouts[cityKey].buildings.sort((a,b)=>{const aVY=(tcY_city+a.offsetY)-a.buildingHeight;const bVY=(tcY_city+b.offsetY)-b.buildingHeight;if(aVY!==bVY)return aVY-bVY;return(tcX_city+a.offsetX)-(tcX_city+b.offsetX);});
            }
        }
    }
    for (let r_forest = 0; r_forest < MAP_ROWS; r_forest++) {
        for (let c_forest = 0; c_forest < MAP_COLS; c_forest++) {
            if (mapData[r_forest][c_forest] === TILE_TYPE.FOREST) {
                const forestKey = `forest-${c_forest}-${r_forest}`;
                featureLayouts[forestKey] = { trees: [] }; 
                const { x: screenX_forest, y: screenYBase_forest } = isoToScreen(c_forest, r_forest);
                const numTrees = 2 + Math.floor(seededRandom(c_forest, r_forest, 200) * 3);
                for (let i = 0; i < numTrees; i++) {
                    const tS = i * 10;
                    featureLayouts[forestKey].trees.push({
                        dx: (seededRandom(c_forest, r_forest, tS + 1) - 0.5) * TILE_WIDTH_HALF * 0.7,
                        dy: (seededRandom(c_forest, r_forest, tS + 2) - 0.5) * TILE_HEIGHT_HALF * 0.5,
                        scale: 0.7 + seededRandom(c_forest, r_forest, tS + 3) * 0.6
                    });
                }
                featureLayouts[forestKey].trees.sort((a, b) => (screenYBase_forest + a.dy) - (screenYBase_forest + b.dy));
            }
        }
    }

    // 3. Generate train path
    trainPath.length = 0;if(placedCitiesCoords.length>=2){
        placedCitiesCoords.sort((a,b) => { if (a.x !== b.x) return a.x - b.x; return a.y - b.y; });
        for(let i=0;i<placedCitiesCoords.length-1;i++){ 
            const sC=placedCitiesCoords[i];const eC=placedCitiesCoords[i+1]; 
            const seg=aStar(sC,eC,mapData,MAP_COLS,MAP_ROWS); 
            if(seg && validatePathSegment(seg, mapData)){
                if(trainPath.length===0)trainPath.push(...seg);else trainPath.push(...seg.slice(1));
            } else {
                console.warn(`No valid path: ${sC.name} to ${eC.name}`); 
                if(seg)console.error("A* path failed validation!",seg);
            }
        }
    }
    if(trainPath.length<2){console.warn("Final trainPath too short or failed, using fallback path.");const m=Math.min(Math.floor(MAP_COLS/5),Math.floor(MAP_ROWS/5),3); const c1=m;const r1=m;const c2=MAP_COLS-1-m;const r2=MAP_ROWS-1-m;trainPath.length=0; if(c2>c1&&r2>r1){for(let c=c1;c<=c2;c++)trainPath.push({x:c,y:r1});for(let r=r1+1;r<=r2;r++)trainPath.push({x:c2,y:r});for(let c=c2-1;c>=c1;c--)trainPath.push({x:c,y:r2});for(let r=r2-1;r>r1;r--)trainPath.push({x:c1,y:r});trainPath.push({x:c1,y:r1});} else {trainPath.push({x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:0,y:0});}}
    window.train.segmentIndex=0;window.train.progress=0;
}