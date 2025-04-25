import * as mediasoupClient from "mediasoup-client";
import {
  ProducerOptions,
  RtpCapabilities,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import { Socket } from "socket.io-client";

const initdevice = () => {
  const device = new mediasoupClient.Device();
  console.log(mediasoupClient.detectDevice());
  return device;
};
const onrouterRtpCapabilties = (
  socket: Socket,
  device: mediasoupClient.Device
) => {
  socket.on("routerRtpCapabilities", (rtpcapabilities: RtpCapabilities) => {
    console.log("routercapabilities", rtpcapabilities);
    device.load({ routerRtpCapabilities: rtpcapabilities }).then(() => {
      console.log("devicecapabilities", device.rtpCapabilities);
    });
  });
};

async function createSendTransport(
  socket: Socket,
  device: mediasoupClient.Device,
  roomname: string
): Promise<Transport> {
  const routerTransportOptions: TransportOptions = await socket.emitWithAck(
    "serverCreateWebRtcTransport",
    roomname
  );
  console.log("r", routerTransportOptions);
  try {
    const transport = device.createSendTransport(routerTransportOptions);
    console.log("trans-id", transport.id);

    const transportId = transport.id;
    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      const ans = await socket.emitWithAck("transport-connect", {
        dtlsParameters,
        transportId,
        roomname,
      });
      switch (ans) {
        case "connected":
          // console.log("transport connected");
          callback();
          break;
        default:
          errback(ans);
          break;
      }
      console.log(ans);
    });

    transport.on("produce", async (parameters, callback, errback) => {
      console.log("produce event");
      const id = await socket.emitWithAck("transport-produce", {
        parameters,
        transportId,
        roomname,
      });
      if (!id) {
        // errback()
        const error = new Error(
          "something went wrong with producer transport creation"
        );
        console.error("transport produce error");
        errback(error);
      }
      if (id == "room doesn't exist" || id == "transport doesn't exist") {
        console.error(id);
        errback(id);
        throw new Error(id);
      }
      console.log("server produced", id);
      callback({ id });
    });

    return transport;
  } catch (error) {
    switch (error) {
      case "InvalidStateError":
        console.log("device not loaded", error);
        break;
      case "TypeError":
        console.log("invalid args", error);
        break;
      default:
        console.log(error);
        break;
    }
    throw error;
  }
}
async function createRecieveTransport(
  socket: Socket,
  device: mediasoupClient.Device,
  roomname: string,
  producerid: string
): Promise<Transport> {
  const routerTransportOptions = await socket.emitWithAck(
    "serverCreateWebRtcRecieveTransport",
    { capabilities: device.rtpCapabilities, roomname, producerid }
  );
  if (routerTransportOptions === "you cannot consume") {
    throw new Error("cannot consume");
  }
  console.log("r", routerTransportOptions);
  try {
    const transport = device.createRecvTransport(routerTransportOptions);

    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      const ans = await socket.emitWithAck("transport-connect-consumer", {
        dtlsParameters,
        roomname,
        transportId: transport.id,
      });
      switch (ans) {
        case "connected":
          console.log("transport connected");
          callback();
          break;
        default:
          errback(ans);
          break;
      }
      console.log(ans);
    });

    transport.on(
      "connectionstatechange",
      (connectionState: RTCPeerConnectionState) => {
        switch (connectionState) {
          case "connecting":
            console.log("connecting");
            break;
          case "connected":
            break;
          default:
            break;
        }
      }
    );

    return transport;
  } catch (error) {
    switch (error) {
      case "InvalidStateError":
        console.log("device not loaded", error);
        break;
      case "TypeError":
        console.log("invalid args", error);
        break;
      default:
        console.log(error);
        break;
    }
    throw error;
  }
}

const produceMedia = async (transport: Transport, localstream: MediaStream) => {
  const producerOptions: ProducerOptions = {};
  producerOptions.track = localstream.getVideoTracks()[0];
  console.log("producing");
  return await transport.produce(producerOptions);
};

export default initdevice;
export {
  onrouterRtpCapabilties,
  createSendTransport,
  createRecieveTransport,
  produceMedia,
};
