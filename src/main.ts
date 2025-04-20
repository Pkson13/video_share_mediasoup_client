import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";
import {
  createSendTransport,
  onrouterRtpCapabilties,
  produceMedia,
} from "./medieasoup";
import { Producer, Transport } from "mediasoup-client/types";
import { createVIdeoElement, gum } from "./dom";

const callbtn = document.querySelector<HTMLButtonElement>("#call");
const nameinput = document.querySelector(".nameinput");
const jionbtn = document.querySelector("#join");
const modal = document.querySelector(".container");
const calls = document.querySelector(".calls-container");
let localstream: MediaStream;

jionbtn?.addEventListener("click", () => {
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  calls?.classList.remove("hide");
  calls?.classList.add("show");
});

const socket = io("https://localhost:3000");
let device: mediasoupClient.Device = new mediasoupClient.Device();
console.log(device.handlerName);
let transport: Transport;
let producer: Producer;

socket.on("connect", () => {
  console.log(socket.id);
  // device = initdevice();

  onrouterRtpCapabilties(socket, device);
});

// socket.emit("serverCreateWebRtcTransport")

callbtn?.addEventListener("click", async () => {
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  localstream = await gum(device);
  transport = await createSendTransport(socket, device);
  createVIdeoElement(localstream, "local");
  producer = await produceMedia(transport, localstream);
});
