#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>


#define WIFI_SSID     "Ijaz"
#define WIFI_PASSWORD "12345678"


#define FIREBASE_HOST "https://smart-parking-59ecb-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_PATCH_URL FIREBASE_HOST "/.json"


#define TRIG1 4
#define ECHO1 19

#define TRIG2 5
#define ECHO2 18


#define LED_A_RED  12
#define LED_A_BLUE 13

#define LED_B_RED  14
#define LED_B_BLUE 27


WiFiClientSecure secureClient;
HTTPClient       https;
bool             httpInitialised = false;


String prevS1 = "";
String prevS2 = "";


float getDistance(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duration = pulseIn(echo, HIGH, 15000);   
  if (duration == 0) return -1;
  return duration * 0.034 / 2;
}



void updateLED(int redPin, int bluePin, const String& status) {
  if (status == "occupied") {
    digitalWrite(redPin, HIGH);
    digitalWrite(bluePin, LOW);
  } else if (status == "available") {
    digitalWrite(redPin, LOW);
    digitalWrite(bluePin, HIGH);
  } else {
    digitalWrite(redPin, LOW);
    digitalWrite(bluePin, LOW);
  }
}


void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.println("WiFi lost — reconnecting…");
  WiFi.reconnect();
  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 8000) {
    delay(200);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\nReconnected ✅" : "\nFailed ❌");
}


void sendBatchToFirebase(float d1, const String& s1, float d2, const String& s2) {
  ensureWiFi();
  if (WiFi.status() != WL_CONNECTED) return;


  if (!httpInitialised) {
    secureClient.setInsecure();            
    if (!https.begin(secureClient, FIREBASE_PATCH_URL)) {
      Serial.println("HTTPS begin failed ❌");
      return;
    }
    https.addHeader("Content-Type", "application/json");
    https.setReuse(true);                   
    httpInitialised = true;
  }


  bool z1Offline = (d1 == -1);
  bool z2Offline = (d2 == -1);

  String payload = "{";


  payload += "\"sensorDetection/A/detected\":" + String(s1 == "occupied" ? "true" : "false") + ",";
  payload += "\"sensorDetection/A/updatedAt\":{\".sv\":\"timestamp\"},";

  payload += "\"sensorDetection/B/detected\":" + String(s2 == "occupied" ? "true" : "false") + ",";
  payload += "\"sensorDetection/B/updatedAt\":{\".sv\":\"timestamp\"}";


  unsigned long t0 = millis();
  int code = https.PATCH(payload + "}");
  unsigned long rtt = millis() - t0;

  if (code != 200) {
    Serial.printf("PATCH code %d — resetting connection\n", code);
    https.end();
    httpInitialised = false;
  }

  Serial.printf("Batch PATCH: %d  |  RTT: %lums\n", code, rtt);
}



void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT); pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT); pinMode(ECHO2, INPUT);


  pinMode(LED_A_RED,  OUTPUT); pinMode(LED_A_BLUE, OUTPUT);
  pinMode(LED_B_RED,  OUTPUT); pinMode(LED_B_BLUE, OUTPUT);


  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected ✅");
}



void loop() {

  float d1 = getDistance(TRIG1, ECHO1);
  float d2 = getDistance(TRIG2, ECHO2);

  String s1 = (d1 == -1) ? "error" : (d1 < 10 ? "occupied" : "available");
  String s2 = (d2 == -1) ? "error" : (d2 < 10 ? "occupied" : "available");

  
  updateLED(LED_A_RED, LED_A_BLUE, s1);
  updateLED(LED_B_RED, LED_B_BLUE, s2);

 
  Serial.printf("Zone A → %.1f cm | %s\n", d1, s1.c_str());
  Serial.printf("Zone B → %.1f cm | %s\n", d2, s2.c_str());

 
  if (s1 == prevS1 && s2 == prevS2) {
    Serial.println("No change — skipping write");
    delay(500);  
    return;
  }

  prevS1 = s1;
  prevS2 = s2;

  sendBatchToFirebase(d1, s1, d2, s2);

  Serial.println("----------------------");

  delay(500);   
}