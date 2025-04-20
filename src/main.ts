import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";
import { createSendTransport, onrouterRtpCapabilties } from "./medieasoup";
import { RtpCapabilities, Transport } from "mediasoup-client/types";

const callbtn = document.querySelector<HTMLButtonElement>("#call");
const nameinput = document.querySelector(".nameinput");
const jionbtn = document.querySelector("#join");
const modal = document.querySelector(".container");
const calls = document.querySelector(".calls-container");

jionbtn?.addEventListener("click", () => {
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  calls?.classList.remove("hide");
  calls?.classList.add("show");
});

const socket = io("https://localhost:3000");
let device: mediasoupClient.Device = new mediasoupClient.Device();
let transport: Transport;

socket.on("connect", () => {
  console.log(socket.id);
  // device = initdevice();

  onrouterRtpCapabilties(socket, device);
});

// socket.emit("serverCreateWebRtcTransport")

transport = await createSendTransport(socket, device);

callbtn?.addEventListener("click", () => {
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  // createSendTransport(socket, device);
});
