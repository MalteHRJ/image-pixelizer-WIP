"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components//ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ImagePreview from "./image-preview";
import { useEffect, useState } from "react";

//TODO clean up code
//TODO add comments
type InputOptions = {
  preserveResolution: boolean;
  outputWidth: number;
  method: string;
  imgFormat: string;
};
export default function ImageControls() {
  const [imageOutput, setImageOutput] = useState<string>(null);

  /* sends the image to our wasm module and sends back the result */
  const processImage = async (image: File, options: InputOptions) => {
    const buffer = await image.arrayBuffer();
    const data = new Uint8Array(buffer);
    const res = await (window as any).pixelize(data, options);
    const filetype = "image/" + options.imgFormat;
    console.log(res);

    const blob = new Blob([res], { type: filetype });
    const imageUrl = URL.createObjectURL(blob);
    setImageOutput(imageUrl);
  };

  /* loading and instantiating the wasm module */
  useEffect(() => {
    async function loadWasm() {
      /* appending wasm_exec.js as a script tag to the page.
   wasm_exec.js is the bridge between wasm and js,written by the go team and modified by the tinyGo project
   */
      if (typeof window !== "undefined") {
        const wasmExec = document.createElement("script");
        wasmExec.src = "/wasm/wasm_exec.js";
        wasmExec.async = true;
        await new Promise((resolve) => {
          wasmExec.onload = resolve;
          document.body.appendChild(wasmExec);
          console.log("wasm_exec loaded and appended");
        });

        /* fetching the wasm file and instantiating it */
        const go = new (window as any).Go();
        WebAssembly.instantiateStreaming(
          fetch("/wasm/pixelizer.wasm"),
          go.importObject
        ).then((result) => {
          go.run(result.instance);
          console.log("wasm module fetched and instantiated");
        });
      }
    }
    loadWasm();
  }, []);

  const handleChange = async (e) => {
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const file = formData.get("imageFile") as File;
    if (file.size == 0) return;
    const outputWidth = parseInt(formData.get("width") as string);
    const Options = {
      preserveResolution: formData.get("keepResolution") === "on",
      outputWidth: outputWidth > 0 ? outputWidth : 1,
      method: formData.get("method") as string,
      imgFormat: file.type.split("/")[1],
    };
    if (Options && !Object.values(Options).includes(null)) {
      await processImage(file, Options);
    }
  };
  return (
    <>
      <section className="grid gap-4 px-4 place-items-center">
        <form action="" onChange={handleChange} className="grid gap-4 p-4">
          <div className="flex gap-4">
            <div className="grid gap-4">
              <ImageControlsUpload />
              <ImageControlsMethod />
            </div>
            <ImageControlsSize />
          </div>
          {imageOutput ? (
            <ImageControlsDownload outputImage={imageOutput} />
          ) : null}
        </form>
      </section>
      <Separator />
      {imageOutput ? <ImagePreview outputImage={imageOutput} /> : null}
    </>
  );
}
export function ImageControlsUpload() {
  return (
    <div className="flex flex-col gap-2 h-full ">
      <Label htmlFor="file-upload" className="pl-2">
        upload image
      </Label>
      <Input
        required
        name="imageFile"
        type="file"
        accept="image/*"
        id="file-upload"
        placeholder="choose file"
        className="text-xs cursor-pointer h-full"
        title="supported types: png,jpg,gif"
      ></Input>
    </div>
  );
}
export function ImageControlsDownload({
  outputImage,
}: {
  outputImage: string;
}) {
  function handleDownload(e) {
    e.preventDefault();
    const link = document.createElement("a");
    link.href = outputImage;
    link.download = "pixelized";
    link.click();
  }
  return (
    <Button variant="secondary" onClick={handleDownload}>
      download result
    </Button>
  );
}

export function ImageControlsSize() {
  return (
    <div className="grid gap-2 p-4 rounded-sm border-border border">
      <h3>Size</h3>
      <Separator />
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="width">width in pixels</Label>
          <Input
            required
            defaultValue={32}
            name="width"
            type="number"
            inputMode="numeric"
            placeholder="width in pixels"
            id="width"
            min={1}
            max={512}
            pattern="[0-9]{1,5}"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="keep-resolution" name="keepResolution" />
          <Label htmlFor="keep-resolution" className="cursor-pointer">
            keep original resolution
          </Label>
        </div>
      </div>
    </div>
  );
}
export function ImageControlsMethod() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-sm border-border border h-min self-end">
      <h3>Method</h3>
      <Separator />
      <RadioGroup defaultValue="average" name="method">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="average" id="average" />
          <Label htmlFor="average" className="cursor-pointer">
            average
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nearest" id="nearest" />
          <Label htmlFor="nearest" className="cursor-pointer">
            nearest
          </Label>
        </div>
        {/*   <div className="flex items-center gap-2">
          <RadioGroupItem value="frequency" id="frequency" />
          <Label htmlFor="frequency" className="cursor-pointer">
            frequency
          </Label>
        </div> */}
      </RadioGroup>
    </div>
  );
}
