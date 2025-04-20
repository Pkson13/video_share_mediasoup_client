import { Device } from "mediasoup-client";

const gum = async (device: Device): Promise<MediaStream> => {
  // named the funtion gum coz getUserMedia already exists
  if (!device.canProduce) {
    throw new Error("device cannot produce media");
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return stream;
  } catch (error) {
    console.log("something went wrong in gum\n");
    console.log(error);
    throw error;
  }
};
type videoelement = "remote" | "local";
const createVIdeoElement = (stream: MediaStream, type: videoelement) => {
  const local = document.querySelector(`.${type}`);
  const video = document.createElement("video");
  video.setAttribute("controls", "");
  if (local) {
    local.append(video);
  }
  if (type === "remote") {
    let remotestream = document.querySelector(`.${type}`);
    if (remotestream) {
      remotestream.append(video);
      video.srcObject = stream;
    }
    // stream.forEach((track) => {
    // remotestream.addTrack(stream);
    // });
  } else if (type === "local") {
    video.srcObject = stream; // note: srcObject, not srcobject
  }
  video.play();
  console.log(`tracks`);
  // console.log(stream.getTracks());
};

export { gum, createVIdeoElement };
