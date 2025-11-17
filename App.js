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
  {x: 160, y: 200},
  {x: 120, y: 200},
  {x: 80, y: 200},
  {x: 40, y: 200},
];

const App = () => {
  
  let prevCoordsOfEachSegment = initialWormBody.map(segment => ({...segment}));
  
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
        // head is 40x40, head.x/head.y are top-left
        return pageX >= head.x && pageX <= head.x + 40 && pageY >= head.y && pageY <= head.y + 40;
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
    
    // move the worm head to the touch position (center the 40x40 image)
    const newHead = { x: Math.round(pageX) - 20, y: Math.round(pageY) - 20 };
    
    // update worm body: each segment is updated so, that current x, y are added by dx, dy,
    // where dx, dy are the difference between the previous segment and the current segment,
    // but limited to a maximum distance of 40 pixels (the size of each segment)
    setWormBody(prevBody => {
      const newBody = prevBody.map((segment, index) => {
        if (index === 0) {
          // head segment
          return newHead;
        } else {
          const prevSegment = index === 1 ? newHead : prevBody[index - 1];
          const dx = prevSegment.x - segment.x;
          const dy = prevSegment.y - segment.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 40) {
            const angle = Math.atan2(dy, dx);
            return {
              x: Math.round(prevSegment.x - 40 * Math.cos(angle)),
              y: Math.round(prevSegment.y - 40 * Math.sin(angle)),
            };
          } else {
            return { ...segment };
          }
        }
      });
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
                    width: 40,
                    height: 40,
                    position: 'absolute',
                    left: segment.x,
                    top: segment.y,
                  }}
                  source={ require('./assets/worm.jpg') }
                  
                />
                ) : (
                
                <Image
                 key={index}
                  style={{
                    width: 40,
                    height: 40,
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
