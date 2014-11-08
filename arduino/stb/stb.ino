#include <Wire.h>
#include <LSM303.h>
#include <SoftwareSerial.h>

LSM303 compass;
SoftwareSerial Bluetooth = SoftwareSerial(2, 3);

void setup() {
    Bluetooth.begin(9600);
    
    Serial.begin(9600);
    Wire.begin();
    
    compass.init();
    compass.enableDefault();
}


char out[80];

void loop() {
    compass.read();

    sprintf(out, "A: x: %5d y: %5d z: %5d ", (int)compass.a.x, (int)compass.a.y, (int)compass.a.z);
    Bluetooth.print(out);
    
    sprintf(out, "M: x: %5d y: %5d z: %5d", (int)compass.m.x, (int)compass.m.y, (int)compass.m.z);
    Bluetooth.println(out);
    
    delay(100);
}
