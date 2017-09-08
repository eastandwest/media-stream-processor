# pipeline example

## usb connected camera (split to analyzer and janus)

```
  -
    -v4l2src device=/dev/video0
    - video/x-raw,format=RGB,width=640,height=480,framerate=30/1
    - tee name=t
  -
    - t.
    - queue
    - videoconvert
    - timeoverlay
    - vp8enc target-bitrate=51200
    - rtpvp8pay
    - udpsink host=janus port=5004
  -
    - t.
    - queue
    - appsink max-buffers=1 name=sink
```

## rtp from raspi

### video source

```
gst-launch-1.0 v4l2src device=/dev/video0 ! \
  video/x-raw,format=RGB,width=640,height=480,framerate=30/1 ! \
  videoconvert ! timeoverlay ! \
  omxh264enc target-bitrate=2000000 control-rate=variable ! \
  rtph264pay config-interval=1 pt=96 ! \
  udpsink host=10.49.52.197 port=15004
```

### analyzer

* split via ip multicast

```
gst-launch-1.0 udpsrc port=15004 ! \
  udpsink host=224.1.1.1 port=25004 loop=true
```

* relay to janus

```
gst-launch-1.0 udpsrc address=224.1.1.1 port=25004 ! progressreport ! udpsink host=localhost port=5004
```

* to analyzer

```
gst-launch-1.0 udpsrc address=224.1.1.1 port=25004 caps="application/x-rtp, media=(string)video, clock-rate=(int)90000, encoding-name=(string)H264" ! \
  rtph264depay ! avdec_h264  ! videoconvert ! jpegenc ! \
  appsink max-buffers=1 name=sink
```
