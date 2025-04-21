import * as mediasoupClient from "mediasoup-client";
import { io } from "socket.io-client";
import {
  createRecieveTransport,
  createSendTransport,
  onrouterRtpCapabilties,
  produceMedia,
} from "./medieasoup";
import {
  Consumer,
  ConsumerOptions,
  Producer,
  Transport,
} from "mediasoup-client/types";
import { createVIdeoElement, gum } from "./dom";

const socket = io("https://localhost:3000");
let device: mediasoupClient.Device = new mediasoupClient.Device();
console.log(device.handlerName);
let transport: Transport;
let producer: Producer;
let consumer: Consumer;

const callbtn = document.querySelector<HTMLButtonElement>("#call");
const nameinput = document.querySelector(".nameinput");
const jionbtn = document.querySelector("#join");
const modal = document.querySelector(".container");
const calls = document.querySelector(".calls-container");
let localstream: MediaStream;
let remotestream = new MediaStream();

socket.on("connect", () => {
  console.log(socket.id);
  // device = initdevice();

  onrouterRtpCapabilties(socket, device);
});

socket.on("newConsumer", async (consumeroptions: ConsumerOptions) => {
  console.log("consumerOptions", consumeroptions);
  consumer = await transport.consume(consumeroptions);
  const respone = await socket.emitWithAck("client-consumer-created");
  console.log(respone);
  if (respone === "resumed") {
    remotestream.addTrack(consumer.track);
    createVIdeoElement(remotestream, "remote");
  }
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

jionbtn?.addEventListener("click", async () => {
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  // calls?.classList.remove("hide");
  // calls?.classList.add("show");
  transport = await createRecieveTransport(socket, device);
});
