import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableHighlight, PanResponder } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
// import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from "react";

ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// define worms body as pixel coordinates coordinates beginning from head to tail
const initialWormBody = [
  {x: 200, y: 200},
  {x: 150, y: 200},
  {x: 100, y: 200},
  {x: 50, y: 200},
  {x: 0, y: 200},
];

const SEGMENT_SIZE = 60; // size of each segment in px
const SAFETY_BUFFER = 30; // allow this many px as "safe" distance
// collision only when centers are closer than COLLISION_THRESHOLD
const COLLISION_THRESHOLD = Math.max(0, SEGMENT_SIZE - SAFETY_BUFFER);

const App = () => {
  
  const [isGameStarted, setIsGameStarted] = useState(false);  
  const [touchPos, setTouchPos] = useState(null);
  const [wormBody, setWormBody] = useState(initialWormBody);
  const [foodPos, setFoodPos] = useState({ x: 700, y: 200 });
  
  // keep a ref to the latest wormBody so panResponder callbacks can read current head pos
  const wormBodyRef = useRef(wormBody);
  const foodPosRef = useRef(foodPos);
  const hasCollectedRef = useRef(false); // track if food was just collected this frame
  
  useEffect(() => { wormBodyRef.current = wormBody; }, [wormBody]);
  useEffect(() => { foodPosRef.current = foodPos; }, [foodPos]);
  
  const drawFoodCoords = (currentFoodPos) => {
    let collides = true;
    while (collides) {
      const rx = Math.floor(Math.random() * (windowWidth - SEGMENT_SIZE * 2));
      const ry = Math.floor(Math.random() * (windowHeight - SEGMENT_SIZE * 2));
      
      // check, that food is far enough from its previous position
      const ddx = (currentFoodPos.x + SEGMENT_SIZE/2) - (rx + SEGMENT_SIZE/2);
      const ddy = (currentFoodPos.y + SEGMENT_SIZE/2) - (ry + SEGMENT_SIZE/2);
      const dist = Math.sqrt(ddx*ddx + ddy*ddy);
      if (dist < COLLISION_THRESHOLD * 2) {
        collides = true;
      } else {
        collides = false;
        return { x: rx, y: ry };
      }
    }
  }
  
  const startGame = () => {
    setWormBody(initialWormBody);
    setFoodPos({x: 700, y: 200});
    setIsGameStarted(true);
    hasCollectedRef.current = false;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        if (!isGameStarted) return false;
        const head = wormBodyRef.current[0];
        if (!head) return false;
        const pageX = e.nativeEvent.pageX;
        const pageY = e.nativeEvent.pageY;
        return pageX >= head.x && pageX <= head.x + SEGMENT_SIZE && pageY >= head.y && pageY <= head.y + SEGMENT_SIZE;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gesture) => { handleTouch(e, gesture); },
      onPanResponderMove: (e, gesture) => { handleTouch(e, gesture); },
      onPanResponderRelease: () => { hasCollectedRef.current = false; },
    })
  ).current;
  
  const handleTouch = (e, gestureState) => {
    const pageX = (gestureState && gestureState.moveX) || e.nativeEvent.pageX;
    const pageY = (gestureState && gestureState.moveY) || e.nativeEvent.pageY;
    const locationX = e.nativeEvent.locationX;
    const locationY = e.nativeEvent.locationY;

    setTouchPos({ locationX, locationY, pageX, pageY });
    
    const newHead = { x: Math.round(pageX) - SEGMENT_SIZE/2, y: Math.round(pageY) - SEGMENT_SIZE/2 };
    
    // check food collision before updating body
    const foodCenter = { x: foodPosRef.current.x + SEGMENT_SIZE/2, y: foodPosRef.current.y + SEGMENT_SIZE/2 };
    const headCenter = { x: newHead.x + SEGMENT_SIZE/2, y: newHead.y + SEGMENT_SIZE/2 };
    const ddx = headCenter.x - foodCenter.x;
    const ddy = headCenter.y - foodCenter.y;
    const centerDist = Math.sqrt(ddx*ddx + ddy*ddy);
    
    if (centerDist < COLLISION_THRESHOLD && !hasCollectedRef.current) {
      // food collected -> generate and set new food position immediately
      hasCollectedRef.current = true;
      const newFoodPos = drawFoodCoords(foodPosRef.current);
      setFoodPos(newFoodPos);
    }
    
    setWormBody(prevBody => {
      let currentBody = prevBody;
      
      // grow worm only once per food collection
      if (centerDist < COLLISION_THRESHOLD && hasCollectedRef.current) {
        const newSegment = { ...prevBody[prevBody.length - 1] };
        currentBody = [ ...prevBody, newSegment ];
      }

      const newBody = [ newHead ];
      for (let i = 1; i < currentBody.length; i++) {
        const target = newBody[i - 1];
        const curr = currentBody[i];
        const dx = target.x - curr.x;
        const dy = target.y - curr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > SEGMENT_SIZE) {
          const angle = Math.atan2(dy, dx);
          newBody.push({
            x: Math.round(target.x - Math.cos(angle) * SEGMENT_SIZE),
            y: Math.round(target.y - Math.sin(angle) * SEGMENT_SIZE),
          });
        } else {
          newBody.push({ ...curr });
        }
      }

      // collision check with body
      const headCenterNew = { x: newBody[0].x + SEGMENT_SIZE/2, y: newBody[0].y + SEGMENT_SIZE/2 };
      for (let i = 1; i < newBody.length; i++) {
        const segCenter = { x: newBody[i].x + SEGMENT_SIZE/2, y: newBody[i].y + SEGMENT_SIZE/2 };
        const distDx = headCenterNew.x - segCenter.x;
        const distDy = headCenterNew.y - segCenter.y;
        const collisionDist = Math.sqrt(distDx*distDx + distDy*distDy);
        if (collisionDist < COLLISION_THRESHOLD) {
          setIsGameStarted(false);
          break;
        }
      }

      hasCollectedRef.current = false; // reset food collection flag after body update
      return newBody;
    });
  };
  
  return (
     <View style={styles.container} {...(isGameStarted ? panResponder.panHandlers : {})} >
        <View>
            <Image style={styles.background} source={require("./assets/landscape.jpg")} />
        </View>
        {!isGameStarted ? (
        <View style={{ flex:1 }}>
          <TouchableHighlight onPress={() => startGame()}>
            <View>
            <Image style={styles.startImg} source={require("./assets/worm.jpg")} />
            </View>
          </TouchableHighlight>
        </View>
        
        ) : (
          
          <View style={{ flex:1 }}>
          
          <Image
            style={{
              width: SEGMENT_SIZE,
              height: SEGMENT_SIZE,
              position: 'absolute',
              left: foodPos.x,
              top: foodPos.y,
            }}
            source={ require('./assets/apple.jpg') }
          />
          
          <TouchableHighlight>
            <View>
              {wormBody.map((segment, index) => (
                
                index === 0 ? (
                
                <Image
                  key={index}
                  style={{
                    width: SEGMENT_SIZE,
                    height: SEGMENT_SIZE,
                    position: 'absolute',
                    left: segment.x,
                    top: segment.y,
                  }}
                  source={ require('./assets/yellowhead.jpg') }
                  
                />
                ) : (
                
                <Image
                 key={index}
                  style={{
                    width: SEGMENT_SIZE,
                    height: SEGMENT_SIZE,
                    position: 'absolute',
                    left: segment.x,
                    top: segment.y,
                    
                  }}
                  source={ require('./assets/greenhead.jpg') }
                />
                
                )
                
              ))}
                
            </View>
          </TouchableHighlight>
          
          </View>

        )}
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        justifyContent: 'flex-end',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
  },
    header: {
        height: 60,
        padding: 15,
        backgroundColor: "darkslateblue"
    },
    text: {
        color: "#fff",
        fontSize: 23,
        textAlign: "center",
    },
    startImg: {
        width: 150,
        height: 150,
        borderRadius: 150 / 2,
        marginTop: windowHeight / 2 - 150 / 2,
        marginLeft: windowWidth / 2 - 150 / 2,
        borderWidth: 3,
        borderColor: "blue",
    },
});

export default App;