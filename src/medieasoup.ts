import * as mediasoupClient from "mediasoup-client";
import { RtpCapabilities, Transport } from "mediasoup-client/types";
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
  device: mediasoupClient.Device
): Promise<Transport> {
  const routerTransportOptions = await socket.emitWithAck(
    "serverCreateWebRtcTransport"
  );
  console.log("r", routerTransportOptions);
  try {
    const transport = device.createSendTransport(routerTransportOptions);
    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      const ans = await socket.emitWithAck("transport-connect", dtlsParameters);
      switch (ans) {
        case "connected":
          callback();
          break;
        default:
          errback(ans);
          break;
      }
      console.log(ans);
    });

    transport.on("produce", async (parameters, callback, errback) => {
      const id = await socket.emitWithAck("tranport-produce", parameters);
      if (!id) {
        // errback()
        throw new Error(
          "something went wrong with producer transport creation"
        );
      }
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

export default initdevice;
export { onrouterRtpCapabilties, createSendTransport };
