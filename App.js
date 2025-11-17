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
  
  //let prevCoordsOfEachSegment = initialWormBody.map(segment => ({...segment}));
  
  const [isGameStarted, setIsGameStarted] = useState(false);  
  const [touchPos, setTouchPos] = useState(null);
  const [wormBody, setWormBody] = useState(initialWormBody);
  
  // keep a ref to the latest wormBody so panResponder callbacks can read current head pos
  const wormBodyRef = useRef(wormBody);
  useEffect(() => { wormBodyRef.current = wormBody; }, [wormBody]);
  
  const startGame = () => {
    setWormBody(initialWormBody);
    setIsGameStarted(true);
  };

  const panResponder = useRef(
    PanResponder.create({
      // only become responder if the touch starts inside the head bounds
      onStartShouldSetPanResponder: (e) => {
        if (!isGameStarted) return false;
        const head = wormBodyRef.current[0];
        if (!head) return false;
        const pageX = e.nativeEvent.pageX;
        const pageY = e.nativeEvent.pageY;
        // head is SEGMENT_SIZE x SEGMENT_SIZE, head.x/head.y are top-left
        return pageX >= head.x && pageX <= head.x + SEGMENT_SIZE && pageY >= head.y && pageY <= head.y + SEGMENT_SIZE;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gesture) => { handleTouch(e, gesture); },
      onPanResponderMove: (e, gesture) => { handleTouch(e, gesture); },
      onPanResponderRelease: () => { /* optional: stop dragging */ },
    })
  ).current;
  
    
  const handleTouch = (e, gestureState) => {
    // prefer gestureState.moveX/Y when available, fallback to nativeEvent.pageX/Y
    const pageX = (gestureState && gestureState.moveX) || e.nativeEvent.pageX;
    const pageY = (gestureState && gestureState.moveY) || e.nativeEvent.pageY;
    const locationX = e.nativeEvent.locationX;
    const locationY = e.nativeEvent.locationY;

    setTouchPos({ locationX, locationY, pageX, pageY });
    
    // move the worm head to the touch position (center the SEGMENT_SIZE image)
    const newHead = { x: Math.round(pageX) - SEGMENT_SIZE/2, y: Math.round(pageY) - SEGMENT_SIZE/2 };
    
    // build new body where each segment tries to remain SEGMENT_SIZE away from the one in front
    setWormBody(prevBody => {
      const newBody = [ newHead ];
      for (let i = 1; i < prevBody.length; i++) {
        const target = newBody[i - 1]; // the segment this one should follow
        const curr = prevBody[i];
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
          // too close -> keep current position (prevents snapping over the leader)
          newBody.push({ ...curr });
        }
      }

      // collision check: compare centers; allow SAFETY_BUFFER px (only collide when closer than threshold)
      const headCenter = { x: newBody[0].x + SEGMENT_SIZE/2, y: newBody[0].y + SEGMENT_SIZE/2 };
      for (let i = 1; i < newBody.length; i++) {
        const segCenter = { x: newBody[i].x + SEGMENT_SIZE/2, y: newBody[i].y + SEGMENT_SIZE/2 };
        const ddx = headCenter.x - segCenter.x;
        const ddy = headCenter.y - segCenter.y;
        const centerDist = Math.sqrt(ddx*ddx + ddy*ddy);
        if (centerDist < COLLISION_THRESHOLD) {
          // collision detected (beyond the allowed safety buffer) -> end game
          setIsGameStarted(false);
          break;
        }
      }

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
    flexDirection: 'row', height: windowWidth,
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
        borderColor: "blue"
    },
});

export default App;