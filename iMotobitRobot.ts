/**
 * Custom blocks
 */
//% color=#00bc11 icon="\uf0ad" weight=120 block="iMotobitRobot"

const MOTOR_ADDRESSS = 0x10

namespace iMotobitRobot {

	/**
	* MotorNum
	*/
    export enum MotorNum {
        //% block="M1"
        M1,
        //% block="M2"
        M2,
		//% block="All"
        All = 2
    }
	
	export enum Dir {
        //% blockId="CW" block="Forward"
        CW = 0x0,
        //% blockId="CCW" block="Backward"
        CCW = 0x1
    }
	
	/**
	* ServoList
	*/
    export enum ServoList {
        //% block="S0" enumval=0
        S0,
        //% block="S1" enumval=1
        S1,
        //% block="S2" enumval=2
        S2,
        //% block="S3" enumval=3
        S3,
        //% block="S4" enumval=4
        S4,
        //% block="S5" enumval=5
        S5,
        //% block="S6" enumval=6
        S6,
        //% block="S7" enumval=7
        S7
    }
	
    /**
    * ServoTypeList
    */
    export enum ServoTypeList {
        //% block="180¢X" 
        _180,
        //% block="270¢X"
        _270,
        //% block="360¢X" 
        _360
    }

    /**
     * TODO: Set M1¡BM2 or All motor's speed. 
     * @param motor M1 or M2 motor , eg: MotorNum.M1
	 * @param direct CW or CCW direct , eg: Dir.CW
     * @param nSpeed motor speed, eg: 0~100
     */
    //% weight=100
    //% blockId=setDCMotorSpeed block="Set %motor direction %direct and speed %nSpeed"
    //% nSpeed.min=0 nSpeed.max=100
    export function setDCMotorSpeed(motor: MotorNum, direct: Dir, nSpeed: number): void {
        let buf = pins.createBuffer(3);
        switch (motor) {
            case MotorNum.M1:
                buf[0] = 0x01;
                buf[1] = direct;
                buf[2] = nSpeed;
                pins.i2cWriteBuffer(MOTOR_ADDRESSS, buf);
                break;
            case MotorNum.M2:
                buf[0] = 0x02;
                buf[1] = direct;
                buf[2] = nSpeed;
                pins.i2cWriteBuffer(MOTOR_ADDRESSS, buf);
                break;
			case MotorNum.All:
                buf[0] = 0x01;
                buf[1] = direct;
                buf[2] = nSpeed;
                pins.i2cWriteBuffer(MOTOR_ADDRESSS, buf);
				buf[0] = 0x02;
                pins.i2cWriteBuffer(MOTOR_ADDRESSS, buf);
                break;
            default:
                break;
        }
    }
	
	/*
     * TODO: Set both of M1 and M2 motor's direction and speed. 
     * @param nM1Speed M1 motor's speed , eg: 100
     * @param nM2Speed M2 motor's speed, eg: -100
     */
    //% weight=98
    //% blockId=set2DCMotorSpeed block="Set motor speed M1: %nM1Speed M2: %nM2Speed"
    //% nM1Speed.min=-100 nM1Speed.max=100
    //% nM2Speed.min=-100 nM2Speed.max=100
    export function set2DCMotorSpeed(nM1Speed: number, nM2Speed: number): void {
		if (nM1Speed > 0)
			setDCMotorSpeed(MotorNum.M1, Dir.CW, nM1Speed);
		else{
			nM1Speed = nM1Speed * -1;
			setDCMotorSpeed(MotorNum.M1, Dir.CCW, nM1Speed);
        }
		
		if (nM2Speed > 0)
			setDCMotorSpeed(MotorNum.M2, Dir.CW, nM2Speed);
		else{
			nM2Speed = nM2Speed * -1;
			setDCMotorSpeed(MotorNum.M2, Dir.CCW, nM2Speed);
        }
    }

	/*
     * TODO: Stop motors. 
     * @param motor A motor in the MotorNum , eg: MotorNum.M1
     */
    //% weight=96
    //% blockId=stopDCMotor block="Stop %motor motor"
    export function stopDCMotor(motor: MotorNum): void {
        setDCMotorSpeed(motor, Dir.CW, 0);
    }


	/*
     * TODO: Setting the angle of a servo motor. 
     * @param servo A servo in the ServoList , eg: ServoList.S1
     * @param angel Angle of servo motor , eg: 90
     */
    //% weight=94
    //% blockId=setServoAngle block="Set %servoType servo %servo angle to %angle"
    //% angle.min=0 angle.max=360
    /*export function setServoAngle(servoType: ServoTypeList, servo: ServoList, angle: number): void {
        let buf = pins.createBuffer(4);
        if (servo == 0) {
            buf[0] = 0x03;
        }
        if (servo == 1) {
            buf[0] = 0x04;
        }
        if (servo == 2) {
            buf[0] = 0x05;
        }
        if (servo == 3) {
            buf[0] = 0x06;
        }
        if (servo == 4) {
            buf[0] = 0x07;
        }
        if (servo == 5) {
            buf[0] = 0x08;
        }
        if (servo == 6) {
            buf[0] = 0x09;
        }
        if (servo == 7) {
            buf[0] = 0x10;
        }

        switch (servoType) {
            case ServoTypeList._180:
                angle = Math.map(angle, 0, 180, 0, 180)
                break
            case ServoTypeList._270:
                angle = Math.map(angle, 0, 270, 0, 180)
                break
            case ServoTypeList._360:
                angle = Math.map(angle, 0, 360, 0, 180)
                break
        }

        buf[1] = angle;
        buf[2] = 0;
        buf[3] = 0;
        pins.i2cWriteBuffer(MOTOR_ADDRESSS, buf);
    }*/
}
