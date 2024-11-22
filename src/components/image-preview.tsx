"use client";

import { useEffect, useRef,useState } from "react";

function drawImage(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const aspectRatio = image.width / image.height;
  console.log(aspectRatio);
  canvas.width = window.innerWidth>700?250:window.innerWidth/2;
  canvas.height = canvas.width / aspectRatio;
  const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 16, 16, canvas.width - 32, canvas.height - 32);
  return;
}
export default function ImagePreview({
  inputImage,
  outputImage,
}: {
  inputImage: HTMLImageElement;
  outputImage: HTMLImageElement;
}) {
  const [inputimg, setInputImg] = useState(null);
  const [outputimg, setOutputImg] = useState(null);
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  useEffect(() => {
    if (!inputImage || !outputImage) return;
    if (!inputimg) {
      setInputImg(inputImage);
    }
    if (inputimg){
      drawImage(inputCanvasRef.current, inputimg);
    }
    if (!outputimg) {
      setOutputImg(outputImage);
    }
if (outputimg){
      drawImage(outputCanvasRef.current, outputimg);
    }
  }, [inputImage, outputImage]);


  return (
    <section className="h-full max-w-full flex">

          <div className="h-full w-full">
            <canvas ref={inputCanvasRef} id="InputImg"></canvas>
          </div>
   
          <div className="h-full w-full">
            <canvas ref={outputCanvasRef} id="OutputImg"></canvas>
          </div>

    </section>
  );
}
export function Pixelizer() {}
