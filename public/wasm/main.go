package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	"image/jpeg"
	"image/png"
	"math"
	"syscall/js"
)

// uninitialized source code.
// for inspection purposes
func DecodeImage(data []uint8, ext string) (image.Image, error) {
	reader := bytes.NewReader(data)
	var img image.Image
	var err error
	// Decode image based on file extension
	switch ext {
	case "jpeg", "jpg":
		img, err = jpeg.Decode(reader)
	case "png":
		img, err = png.Decode(reader)
	case "gif":
		img, err = gif.Decode(reader)
	default:
		return nil, fmt.Errorf("unsupported file format: %s", ext)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %v", err)
	}

	return img, nil
}
func encodeImage(img image.Image, ext string) []byte {

	var buffer = new(bytes.Buffer)

	var err error
	switch ext {
	case "jpeg", "jpg":
		var opt jpeg.Options
		opt = jpeg.Options{Quality: 100}
		err = jpeg.Encode(buffer, img, &opt)
		if err != nil {
			fmt.Println("jpeg encode error", err)

		}
	case "png":
		err = png.Encode(buffer, img)
		if err != nil {
			fmt.Println("png encode error", err)

		}
	case "gif":
		var opt gif.Options
		opt = gif.Options{NumColors: 256}
		err = gif.Encode(buffer, img, &opt)
		if err != nil {
			fmt.Println("gif encode error", err)

		}
	default:
		fmt.Println("unsupported file format: %s", ext)
	}
	if err != nil {
		fmt.Println("failed to decode image: %v", err)
	}

	return buffer.Bytes()
}

func pixelize(this js.Value, args []js.Value) any {
	//convert our file data to []byte
	dataArray := args[0]
	imageData := make([]byte, dataArray.Get("length").Int())
	js.CopyBytesToGo(imageData, dataArray)

	var options struct {
		preserveResolution bool
		outputWidth        int
		method             string
		imgFormat          string
	}
	options.preserveResolution = args[1].Get("preserveResolution").Bool()
	options.outputWidth = args[1].Get("outputWidth").Int()
	options.method = args[1].Get("method").String()
	options.imgFormat = args[1].Get("imgFormat").String()

	fmt.Println("options", options)
	fmt.Println("imagedata length", len(imageData))
	//decodes our file input data to an image of the specified format
	img, err := DecodeImage(imageData, options.imgFormat)
	if err != nil {
		fmt.Println("error decoding image", err)
		return nil
	}
	// gets the dimensions of the image that is divisible by our specified width
	// calculate the size of each pixel and height of the final image
	pixW := options.outputWidth
	bounds := img.Bounds()
	imgW := int(float64(bounds.Dx()) - math.Mod(float64(bounds.Dx()), float64(pixW)))
	pixelSize := int(imgW / pixW)
	imgH := int(float64(bounds.Dy()) - math.Mod(float64(bounds.Dy()), float64(pixelSize)))
	aspectRatio := float64(imgW) / float64(imgH)
	pixH := int(float64(pixW) / aspectRatio)
	imgPixels := image.NewNRGBA(image.Rect(0, 0, imgW, imgH))
	draw.Draw(imgPixels, imgPixels.Bounds(), img, bounds.Min, draw.Src)

	//loop through the images pixel array and create a new image with the desired pixel size and method
	var newImg *image.NRGBA
	if options.preserveResolution == false {
		newImg = image.NewNRGBA(image.Rect(0, 0, pixW, pixH))
	} else {
		newImg = image.NewNRGBA(image.Rect(0, 0, imgW, imgH))
	}

	method := options.method
	switch method {

	case "nearest":
		//grab the color values for the pixelSize-th pixel in the original image and set the corresponding pixel in the output to that value
		for pixY := 0; pixY < pixH; pixY++ {
			for pixX := 0; pixX < pixW; pixX++ {
				r, g, b, a := img.At(pixX*pixelSize, pixY*pixelSize).RGBA()
				pixVal := color.NRGBA{R: uint8(r), G: uint8(g), B: uint8(b), A: uint8(a)}
				if options.preserveResolution == false {
					//case for 1 pixel in the output per value found
					newImg.Set(pixX, pixY, pixVal)
				} else if options.preserveResolution == true {
					//case for pixelsize*pixelsize pixels in the output per value found
					for i := pixY * pixelSize; i < (pixY+1)*pixelSize; i++ {
						for j := pixX * pixelSize; j < (pixX+1)*pixelSize; j++ {
							newImg.Set(j, i, pixVal)
						}
					}

				}
			}
		}

	case "average":
		//gets the average color of a pixelSize*pixelSize square in the original image
		scanBlock := image.Rect(0, 0, pixelSize-1, pixelSize-1)
		for pixY := 0; pixY < pixH; pixY++ {
			for pixX := 0; pixX < pixW; pixX++ {
				var r, g, b uint64
				scanView := imgPixels.SubImage(scanBlock)
				viewBounds := scanView.Bounds()
				for y := viewBounds.Min.Y; y < viewBounds.Max.Y; y++ {
					for x := viewBounds.Min.X; x < viewBounds.Max.X; x++ {
						pixelRGBA := scanView.At(x, y)
						pixR, pixG, pixB, _ := pixelRGBA.RGBA()
						r += uint64(pixR)
						g += uint64(pixG)
						b += uint64(pixB)
					}
				}
				r /= uint64(pixelSize * pixelSize)
				g /= uint64(pixelSize * pixelSize)
				b /= uint64(pixelSize * pixelSize)
				pixVal := color.NRGBA{R: uint8(r / 255), G: uint8(g / 255), B: uint8(b / 255), A: 0xff}
				if options.preserveResolution == false {
					newImg.Set(pixX, pixY, pixVal)
				} else if options.preserveResolution == true {
					//TODO add preserve resolution functionality
					for i := pixY * pixelSize; i < (pixY+1)*pixelSize; i++ {
						for j := pixX * pixelSize; j < (pixX+1)*pixelSize; j++ {
							newImg.Set(j, i, pixVal)
						}
					}
				}
				var Translation image.Point
				Translation.X = pixelSize
				Translation.Y = 0
				scanBlock = scanBlock.Add(Translation)
			}
			var Translation image.Point
			Translation.X = -imgW
			Translation.Y = pixelSize
			scanBlock = scanBlock.Add(Translation)

		}
		//case "frequency":

	}

	buf := bytes.NewBuffer(encodeImage(newImg, options.imgFormat))
	jsOutput := js.Global().Get("Uint8Array").New(len(buf.Bytes()))
	js.CopyBytesToJS(jsOutput, buf.Bytes())

	return jsOutput
}

func main() {

	js.Global().Set("pixelize", js.FuncOf(pixelize))
	select {}
}
