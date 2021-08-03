/**
 * Custom blocks
 */
//% color=#00bc11 icon="\uf1eb" weight=90 block="MotoduinoIoT"

namespace MotoduinoWiFi {
    let onReceivedValueHandler: (topic: string, value: string) => void;
    let mqtt_data:string
    let bAP_Connected: boolean = false
    let bThingSpeak_Connected: boolean = false
    let bMQTT_SUB: boolean = false
    // write AT command with CR+LF ending
    function sendAT(command: string, wait: number = 100) {
        serial.writeString(command + "\u000D\u000A")
        basic.pause(wait)
    }

    // wait for certain response from ESP8266
    function waitResponse(timeout: number = 1000): boolean {
        let serial_str: string = ""
        let result: boolean = false
        let time: number = input.runningTime()
        while (true) {
            serial_str += serial.readString()
			if (serial_str.includes("OK" + "\u000D\u000A")) {
                result = true
                break
            } else if (serial_str.includes("ERROR" + "\u000D\u000A") || serial_str.includes("SEND FAIL"+ "\u000D\u000A")) {
                break
            }
            if (input.runningTime() - time > timeout) {
                break
            }
        }
        return result
    }


    /**
    * Set Motoduino WIFI Terminal 
    */
    //% blockId=Wifi_Setup
    //% weight=100
    //% block="Motoduino WIFI Set| Tx_Pin %txd| Rx_Pin %rxd| SSID %ssid| PASSWORD %passwd"
    //% txd.defl=SerialPin.P15
    //% rxd.defl=SerialPin.P8
    //% ssid.defl="Your_SSID"
    //% passwd.defl="Your_Password"
	
    export function Wifi_Setup(txd: SerialPin, rxd: SerialPin, ssid: string, passwd: string): void {
        bAP_Connected = false

        serial.redirect(txd, rxd, BaudRate.BaudRate9600)
        sendAT("AT+RST")
        basic.pause(3000)
        sendAT("ATE0")
        sendAT("AT+CWMODE=1")
        basic.pause(200)
        sendAT("AT+CWDHCP=1,1")
        basic.pause(200)
        sendAT("AT+CWJAP=\"" + ssid + "\",\"" + passwd + "\"", 0)
        bAP_Connected =waitResponse(20000)
        basic.pause(1000)
    }
	
	
    //% blockId=MQTT_Setup
    //% block="MQTT Setup| server %server| clientID %client| Username %username| Password %passwd"
	
    export function MQTT_Setup(server: string, client: string, username: string, passwd: string): void {
        sendAT("AT+MQTTUSERCFG=0,1,\"" + client + "\",\"" + username + "\",\"" + passwd + "\",0,0,\"\"")
        waitResponse()
        basic.pause(1000)
        sendAT("AT+MQTTCONN=0,\"" + server + "\",1883,0")
        waitResponse(5000)
    }
	
	
    //% blockId=MQTT_pub
    //% block="MQTT Publish| topic %mqtt_topic| data %data"
	
    export function MQTT_pub(mqtt_topic: string, data: string): void {
        sendAT("AT+MQTTPUB=0,\"" + mqtt_topic + "\",\"" + data + "\",0,0");
    }
	
	
    //% blockId=MQTT_sub
    //% block="MQTT Suscribe| topic %mqtt_topic"
	
    export function MQTT_sub(mqtt_topic: string): void {
        bMQTT_SUB=true
        sendAT("AT+MQTTSUB=0,\"" + mqtt_topic + "\",1");
        waitResponse(3000)
        basic.pause(1000)
    }
	
	
    //% blockId=MQTT_Suscribe_Received
    //% block="MQTT Suscribe $topic $message"
    //% draggableParameters
	
    export function MQTT_Suscribe_Received(cb: (topic: string, message: string) => void) {
        onReceivedValueHandler = cb;
    }
	
	
    /**
    * Check if ESP8266 successfully connected to Wifi
    */
    //% blockId=Check_WiFiConnect
    //% weight=90
    //% block="WiFi Connected?"
	
    export function Check_WiFiConnect(): boolean {
        return bAP_Connected
    }


    //% blockId=ThingSpeak_Uploader
    //% weight=80
    //% expandableArgumentMode"toggle" inlineInputMode=inline
    //% block="ThingSpeak Data Upload| Write API Keys %apikey| Field 1 %f1|| Field 2 %f2| Field 3 %f3| Field 4 %f4| Field 5 %f5| Field 6 %f6| Field 7 %f7| Field 8 %f8"

    export function ThingSpeak_Uploader(apikey: string, f1: number, f2?: number, f3?: number, f4?: number, f5?: number, f6?: number, f7?: number, f8?: number): void {
        
        let TSCommand = "GET /update?key=" + apikey + "&field1=" + f1 + "&field2=" + f2 + "&field3=" + f3 + "&field4=" + f4 + "&field5=" + f5 + "&field6=" + f6 + "&field7=" + f7 + "&field8=" + f8
        let ATCommand = "AT+CIPSEND=" + (TSCommand.length + 2)
        sendAT("AT+CIPSTART=\"TCP\",\"api.thingspeak.com\",80")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(TSCommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }


    //% blockId=IFTTT_Service
    //% weight=70
    //% block="IFTTT Service| API Keys %apikey| Event Name %eventName| Value 1 %v1| Value 2 %v2| Value 3 %v3"

    export function IFTTT_Service(apikey: string, eventName: string, v1: number, v2: number, v3: number): void {
        let IFTTTCommand = "GET /trigger/" + eventName + "/with/key/" + apikey + "?value1=" + v1 + "&value2=" + v2 + "&value3=" + v3 + " HTTP/1.1\r\nHost: maker.ifttt.com\r\nConnection: close\r\n\r\n\r\n\r\n"
        let ATCommand = "AT+CIPSEND=" + (IFTTTCommand.length + 2)

        sendAT("AT+CIPSTART=\"TCP\",\"maker.ifttt.com\",80")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(IFTTTCommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }


    //% blockId=GoogleForm_Service
    //% weight=40
    //% expandableArgumentMode"toggle" inlineInputMode=inline
    //% block="Google Form Service| API Keys %apikey| Entry ID1 %entryID1| Data1 %d1|| Entry ID2 %entryID2| Data2 %d2| Entry ID3 %entryID3| Data3 %d3"

    export function GoogleForm_Service(apikey: string, entryID1: string, d1: number, entryID2?: string, d2?: number, entryID3?: string, d3?: number): void {
        let GoogleCommand = "GET /forms/d/e/" + apikey + "/formResponse?entry." + entryID1 + "=" + d1 + "&entry." + entryID2 + "=" + d2 + "&entry." + entryID3 + "=" + d3 + "&submit=Submit HTTP/1.1\r\nHost: docs.google.com\r\nConnection: close\r\n\r\n\r\n\r\n"
        /*
        let GoogleCommand = "GET /forms/d/e/"+ apikey+ "/formResponse?entry."+ entryID1+ "="+ d1
        if(entryID2.length > 0) {
            GoogleCommand += "&entry."+ entryID2+ "="+ d2
        }
        GoogleCommand += "&submit=Submit HTTP/1.1\r\nHost: docs.google.com\r\nConnection: close\r\n\r\n\r\n\r\n"
        */
        let ATCommand = "AT+CIPSEND=" + (GoogleCommand.length + 2)
        sendAT("AT+CIPSTART=\"SSL\",\"docs.google.com\",443")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(GoogleCommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }


    //% blockId=LINENotify_Service
    //% weight=35
    //% block="LINE Notify Service| LINE Token %szToken| LINE Message %szMsg"

    export function LINENotify_Service(szToken: string, szMsg: string): void {
        let szMsgData: string = "message=" + szMsg
        let nMsgDataLen: number = szMsgData.length
        let SendLINECommand = "POST /api/notify HTTP/1.1\u000D\u000AHost: notify-api.line.me\u000D\u000AAuthorization: Bearer " + szToken + "\u000D\u000AContent-Type: application/x-www-form-urlencoded\u000D\u000AContent-Length: " + nMsgDataLen + "\u000D\u000A\u000D\u000A" + szMsgData + "\u000D\u000A\u000D\u000A\u000D\u000A\u000D\u000A"
        let ATCommand = "AT+CIPSEND=" + (SendLINECommand.length + 2)

        sendAT("AT+CIPSTART=\"SSL\",\"notify-api.line.me\",443")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(SendLINECommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }


    export enum FirebaseUploadMethod {
        //% block="PUT"
        FirebaseUploadMethod_1 = 1,
        //% block="POST"
        FirebaseUploadMethod_2 = 2,
        //% block="PATCH"
        FirebaseUploadMethod_3 = 3
    }
    //% blockId=Firebase_Uploader
    //% weight=30
    //% block="Firebase Data Upload| Upload Method %uploadMethod| URL %szFirebaseURL| Key %szFirebaseKey| Path %szFirebasePath| ID 1 %szFirebaseID1| Data 1 %szUpdateData1|| ID 2 %szFirebaseID2| Data 2 %szUpdateData2| ID 3 %szFirebaseID3| Data 3 %szUpdateData3"
    //% szFirebaseURL.defl="xxxxxxx.firebaseio.com"

    export function Firebase_Uploader(uploadMethod: FirebaseUploadMethod, szFirebaseURL: string, szFirebaseKey: string, szFirebasePath: string, szFirebaseID1: string, szUpdateData1: number, szFirebaseID2?: string, szUpdateData2?: number, szFirebaseID3?: string, szUpdateData3?: number): void {
        let szFirebaseData: string = ""
        let FirebaseUploadCommand: string = ""

        if (szFirebaseID1.indexOf("undefined") < 0 && szFirebaseID2.indexOf("undefined") < 0 && szFirebaseID3.indexOf("undefined") < 0) {
            szFirebaseData = "{\"" + szFirebaseID1 + "\":" + szUpdateData1 + ",\"" + szFirebaseID2 + "\":" + szUpdateData2 + ",\"" + szFirebaseID3 + "\":" + szUpdateData3 + "}" + "\u000D\u000A"
        }
        else if (szFirebaseID1.indexOf("undefined") < 0 && szFirebaseID2.indexOf("undefined") < 0) {
            szFirebaseData = "{\"" + szFirebaseID1 + "\":" + szUpdateData1 + ",\"" + szFirebaseID2 + "\":" + szUpdateData2 + "}" + "\u000D\u000A"
        }
        else if (szFirebaseID1.indexOf("undefined") < 0) {
            szFirebaseData = "{\"" + szFirebaseID1 + "\":" + szUpdateData1 + "}" + "\u000D\u000A"
        }
        else {
            return
        }

        let nFirebaseDataLen: number = szFirebaseData.length + 2
        let szUploadMethod: string = ""
        if (uploadMethod == 1)
            szUploadMethod = "PUT"
        if (uploadMethod == 2)
            szUploadMethod = "POST"
        if (uploadMethod == 3)
            szUploadMethod = "PATCH"

        FirebaseUploadCommand = szUploadMethod + " /" + szFirebasePath + ".json?auth=" + szFirebaseKey + " HTTP/1.1\u000D\u000AHost: " + szFirebaseURL + "\u000D\u000AContent-Length: " + nFirebaseDataLen + "\u000D\u000A\u000D\u000A" + szFirebaseData + "\u000D\u000A\u000D\u000A\u000D\u000A\u000D\u000A"
        let ATCommand = "AT+CIPSEND=" + (FirebaseUploadCommand.length + 2)

        sendAT("AT+CIPSTART=\"SSL\",\"" + szFirebaseURL + "\",443")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(FirebaseUploadCommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }


    //% blockId=MCS_Uploader
    //% weight=25
    //% block="MCS Data Upload| Device ID %szDeviceID| Device Key %szDeviceKey| Channel Name %szDataChannelName| Data %nData"

    export function MCS_Uploader(szDeviceID: string, szDeviceKey: string, szDataChannelName: string, nData: number): void {
        let szCSVData: string = szDataChannelName + ",," + nData + "\u000D\u000A"
        let nCSVDataLen: number = szCSVData.length + 2
        let MCSUploadCommand = "POST /mcs/v2/devices/" + szDeviceID + "/datapoints.csv HTTP/1.1\u000D\u000AHost: api.mediatek.com\u000D\u000AContent-Type: text/csv\u000D\u000AdeviceKey: " + szDeviceKey + "\u000D\u000AContent-Length: " + nCSVDataLen + "\u000D\u000A\u000D\u000A" + szCSVData + "\u000D\u000AConnection: close\u000D\u000A\u000D\u000A\u000D\u000A\u000D\u000A"
        let ATCommand = "AT+CIPSEND=" + (MCSUploadCommand.length + 2)
		
        sendAT("AT+CIPSTART=\"SSL\",\"api.mediatek.com\",443")
        waitResponse(5000)
        sendAT(ATCommand)
        waitResponse(1000)
        sendAT(MCSUploadCommand)
        waitResponse(2000)
        sendAT("AT+CIPCLOSE")
        waitResponse(4000)
    }
	
	
    basic.forever(function () {
        if(bMQTT_SUB){
            mqtt_data = serial.readString()
            if (mqtt_data.length > 0) {
                let time = input.runningTime()
                while (true) {
                    mqtt_data = "" + mqtt_data + serial.readString()
                    if (mqtt_data.includes("\u000D\u000A")) {
                        break;
                    }
                    if (input.runningTime() - time > 1000) {
                        break;
                    }
                }
                if(mqtt_data.indexOf("MQTTSUBRECV")>0){
                    let PUB_data = ["","",""];
                    mqtt_data = mqtt_data.substr(0, mqtt_data.length - 2)
                    PUB_data = mqtt_data.split(",")
                    PUB_data[1] = PUB_data[1].substr(1, PUB_data[1].length - 2)
                    onReceivedValueHandler(PUB_data[1],PUB_data[3]);
                }
            }
        }
    })
}
