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
let recievTransports: Transport[] = [];
let producer: Producer;
let consumer: Consumer;
let producerIds: string[] = [];
let transport = {} as Transport;

const callbtn = document.querySelector<HTMLButtonElement>("#call");
const nameinput = document.querySelector<HTMLInputElement>(".nameinput");
const jionbtn = document.querySelector("#join");
const modal = document.querySelector(".container");
const calls = document.querySelector(".calls-container");
let localstream: MediaStream;
const form = document.querySelector(".form");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  e.stopPropagation();
  console.log("Form submitted without reloading");
});

socket.on("connect", () => {
  console.log(socket.id);
  // device = initdevice();

  onrouterRtpCapabilties(socket, device);
});

socket.on("newConsumer", async (consumeroptions: ConsumerOptions) => {
  console.log("consumerOptions", consumeroptions);
  const transport = recievTransports.find(
    (transport) => transport.id == consumeroptions.appData?.transportId
  );
  if (!transport) {
    throw new Error(
      "transport does not exist, somrthing wrong with the appdata from server"
    );
  }
  console.log("transport connecting", transport);

  consumer = await transport.consume(consumeroptions);
  console.log("consumer", consumer);
  const respone = await socket.emitWithAck("client-consumer-created", {
    id: consumeroptions.id,
    roomname: nameinput?.value,
  });
  console.log("res", respone);
  if (respone === "resumed") {
    let remotestream = new MediaStream();
    remotestream.addTrack(consumer.track);
    createVIdeoElement(remotestream, "remote");
  }
});

// socket.emit("serverCreateWebRtcTransport")
socket.on("new-producer", async (producerid: string) => {
  if (producer.id == producerid) {
    console.log("my producer id");
    return;
  }
  console.log("new producer", producerid);
  producerIds.push(producerid);
  if (!nameinput) return;
  const transport = await createRecieveTransport(
    socket,
    device,
    nameinput.value,
    producerid
  );
  recievTransports.push(transport);
});

callbtn?.addEventListener("click", async () => {
  modal?.classList.remove("show");
  const created = await socket.emitWithAck("createRoom", nameinput?.value);
  if (created === "created" && nameinput) {
    modal?.classList.add("hide");
    localstream = await gum(device);
    transport = await createSendTransport(socket, device, nameinput.value);
    createVIdeoElement(localstream, "local");
    producer = await produceMedia(transport, localstream);
  }
});

jionbtn?.addEventListener("click", async () => {
  if (!nameinput) return;
  modal?.classList.remove("show");
  modal?.classList.add("hide");
  const res = await socket.emitWithAck("joinroom", nameinput.value);
  if (res === "room doesn't exist") {
    throw new Error(res);
  }
  console.log("res", res);
  await device
    .load({ routerRtpCapabilities: res.routerRtpCapabilities })
    .then(() => {
      console.log("devicecapabilities", device.rtpCapabilities);
    });
  // calls?.classList.remove("hide");
  // calls?.classList.add("show");
  // producerIds = res.producerIds;
  localstream = await gum(device);
  transport = await createSendTransport(socket, device, nameinput.value);
  // console.log("transport-id", transport.id);
  createVIdeoElement(localstream, "local");
  producer = await produceMedia(transport, localstream);
  // console.log("producer-id", producer.id);

  for (const id of res.producerIds) {
    producerIds.push(id);
  }
  for (const producerid of producerIds) {
    console.log("for loop producerid", producerid);
    const transport = await createRecieveTransport(
      socket,
      device,
      nameinput.value,
      producerid
    );
    recievTransports.push(transport);
  }
});
