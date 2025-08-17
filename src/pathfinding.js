import { TILE_TYPE, MAP_COLS, MAP_ROWS } from './constants.js';

// Cut/paste aStar from lines 125-137 EXACTLY as it is
export function aStar(startNode, goalNode, gridData, cols, rows) {
    function heuristic(nodeA, nodeB) { return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y); }
    function getNeighbors(node, cGD, nC, nR) { const neigh = []; const dirs = [[0,-1],[0,1],[-1,0],[1,0]]; for(const[dx,dy]of dirs){ const nX=node.x+dx; const nY=node.y+dy; if(nX>=0&&nX<nC&&nY>=0&&nY<nR){const tT=cGD[nY][nX]; if(tT!==TILE_TYPE.MOUNTAIN&&tT!==TILE_TYPE.FOREST&&tT!==TILE_TYPE.WATER)neigh.push({x:nX,y:nY});}} return neigh;}
    function reconstructPath(cF, curr) { const tP=[curr]; while(cF[`${curr.x}-${curr.y}`]){curr=cF[`${curr.x}-${curr.y}`];tP.unshift(curr);} return tP;}
    const oS=[startNode]; const cF={}; const gS={}; const fS={};
    for(let rI=0;rI<rows;rI++){for(let cI=0;cI<cols;cI++){gS[`${cI}-${rI}`]=Infinity;fS[`${cI}-${rI}`]=Infinity;}}
    gS[`${startNode.x}-${startNode.y}`]=0; fS[`${startNode.x}-${startNode.y}`]=heuristic(startNode,goalNode);
    while(oS.length>0){oS.sort((a,b)=>fS[`${a.x}-${a.y}`]-fS[`${b.x}-${b.y}`]); const curr=oS.shift(); if(curr.x===goalNode.x&&curr.y===goalNode.y)return reconstructPath(cF,curr);
    const neighs=getNeighbors(curr,gridData,cols,rows); for(const neigh of neighs){ const nTT=gridData[neigh.y][neigh.x]; if(nTT===TILE_TYPE.MOUNTAIN||nTT===TILE_TYPE.FOREST||nTT===TILE_TYPE.WATER)continue;
    let cost=1; if(nTT===TILE_TYPE.CITY)cost=50; const tGS=gS[`${curr.x}-${curr.y}`]+cost;
    if(tGS<gS[`${neigh.x}-${neigh.y}`]){cF[`${neigh.x}-${neigh.y}`]=curr;gS[`${neigh.x}-${neigh.y}`]=tGS;fS[`${neigh.x}-${neigh.y}`]=tGS+heuristic(neigh,goalNode);if(!oS.some(n=>n.x===neigh.x&&n.y===neigh.y))oS.push(neigh);}}}
    return null; 
}

// Cut/paste validatePathSegment from lines 138-143 EXACTLY
export function validatePathSegment(segment, gridData) {
    if (!segment || segment.length === 0) return true; 
    for (const point of segment) { if (point.x < 0 || point.x >= MAP_COLS || point.y < 0 || point.y >= MAP_ROWS) {console.error("Path point out of bounds:", point); return false;}
    const tileType = gridData[point.y][point.x]; if (tileType === TILE_TYPE.MOUNTAIN || tileType === TILE_TYPE.FOREST || tileType === TILE_TYPE.WATER) { console.warn("Path validation fail:", point, "Type:", tileType); return false;}}
    return true; 
}