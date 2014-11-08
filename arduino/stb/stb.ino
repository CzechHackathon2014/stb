#include <Wire.h>
#include <LSM303.h>
#include <SoftwareSerial.h>

LSM303 compass;

//SoftwareSerial Bluetooth = SoftwareSerial(2, 3); - causes framing errors at 57600!

#define Bluetooth Serial

void setup() {
    Bluetooth.begin(57600);
    Wire.begin();
    
    compass.init();
    compass.enableDefault();
}


char out[80];

void loop() {    
    compass.read();
   
    Bluetooth.print("A: x: ");
    Bluetooth.print((int)compass.a.x);
    Bluetooth.print(" y: ");
    Bluetooth.print((int)compass.a.y);
    Bluetooth.print(" z: ");
    Bluetooth.print((int)compass.a.z);
    Bluetooth.print(" M: x: ");
    Bluetooth.print((int)compass.m.x);
    Bluetooth.print(" y: ");
    Bluetooth.print((int)compass.m.y);
    Bluetooth.print(" z: ");
    Bluetooth.println((int)compass.m.z);
    
    delay(92); // magic to have ~ 10 samples/second
}
