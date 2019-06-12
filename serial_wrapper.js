var SerialPort=require("./electron-serialport/index");
var EventEmitter=require("events").EventEmitter;
var wrapper_events=new EventEmitter();
var wrapper_serial=undefined;

async function wrapper_serialport_list(){
    return await SerialPort.list();
}

function wrapper_serialport_on(event,listener){
    wrapper_events.on(event,listener);
}


function wrapper_serialport_open(dev){
    if(wrapper_serial!=undefined){
        wrapper_serial.close();
    }

    wrapper_serial=new SerialPort(dev,{
        baudRate:115200
    })

    wrapper_serial.on("open",()=>{
        wrapper_events.emit("open");
    })

    wrapper_serial.on("close",()=>{
        wrapper_serial=undefined;
        wrapper_events.emit("close");
        wrapper_events.removeAllListeners();
    })

    wrapper_serial.on("data",(d)=>{
        wrapper_events.emit("data",d);
    })

}

function wrapper_serialport_close(){
    if(wrapper_serial!=undefined){
        wrapper_serial.close();
    }
}

function wrapper_serialport_write(data){
    if(wrapper_serial!=undefined){
        wrapper_serial.write(data);
    }
}

module.exports={
    list:wrapper_serialport_list,
    on:wrapper_serialport_on,
    open:wrapper_serialport_open,
    close:wrapper_serialport_close,
    write:wrapper_serialport_write
}