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
    
    // update worm body: each segment follows the one in front of it, 40px away
    setWormBody(prevBody => {
      const newBody = [newHead];
      for (let i = 0; i < prevBody.length - 1; i++) {
        const current = newBody[i];
        const dx = prevBody[i].x - current.x;
        const dy = prevBody[i].y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // normalize direction and set distance to 40px
        const nextSegment = {
          x: current.x + (dx / distance) * 40,
          y: current.y + (dy / distance) * 40,
        };
        newBody.push(nextSegment);
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
