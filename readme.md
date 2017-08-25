# media stream processor

Media Stream Processor in iFogCloud project.

# overview

# dependencies

## gstreamer

version: 1.12.0

* libraries

raspberry PI

```
sudo apt-get update && sudo apt-get upgrade -y --force-yes

sudo apt-get install -y build-essential autotools-dev automake autoconf libtool autopoint libxml2-dev zlib1g-dev libglib2.0-dev pkg-config bison flex python git gtk-doc-tools libasound2-dev libgudev-1.0-dev libxt-dev libvorbis-dev libcdparanoia-dev libpango1.0-dev libtheora-dev libvisual-0.4-dev iso-codes libgtk-3-dev libraw1394-dev libiec61883-dev libavc1394-dev libv4l-dev libcairo2-dev libcaca-dev libspeex-dev libpng-dev libshout3-dev libjpeg-dev libaa1-dev libflac-dev libdv4-dev libtag1-dev libwavpack-dev libpulse-dev libsoup2.4-dev libbz2-dev libcdaudio-dev libdc1394-22-dev ladspa-sdk libass-dev libcurl4-gnutls-dev libdca-dev libdirac-dev libdvdnav-dev libexempi-dev libexif-dev libfaad-dev libgme-dev libgsm1-dev libiptcdata0-dev libkate-dev libmimic-dev libmms-dev libmodplug-dev libmpcdec-dev libofa0-dev libopus-dev librsvg2-dev librtmp-dev libslv2-dev libsndfile1-dev libsoundtouch-dev libspandsp-dev libx11-dev libxvidcore-dev libzbar-dev libzvbi-dev liba52-0.7.4-dev libcdio-dev libdvdread-dev libmad0-dev libmp3lame-dev libmpeg2-4-dev libopencore-amrnb-dev libopencore-amrwb-dev libsidplay1-dev libtwolame-dev libx264-dev libusb-1.0
```

ubuntu16.04LTS

```
sudo apt-get update && sudo apt-get upgrade -y --force-yes

sudo apt-get -y install build-essential autotools-dev automake autoconf libtool autopoint libxml    2-dev zlib1g-dev libglib2.0-dev pkg-config bison flex python git gtk-doc-tools libasound2-dev libgudev-1.0-    dev libxt-dev libvorbis-dev libcdparanoia-dev libpango1.0-dev libtheora-dev libvisual-0.4-dev iso-codes lib    gtk-3-dev libraw1394-dev libiec61883-dev libavc1394-dev libv4l-dev libcairo2-dev libcaca-dev libspeex-dev l    ibpng-dev libshout3-dev libjpeg-dev libaa1-dev libflac-dev libdv4-dev libtag1-dev libwavpack-dev libpulse-d    ev libsoup2.4-dev libbz2-dev libcdaudio-dev libdc1394-22-dev ladspa-sdk libass-dev libcurl4-gnutls-dev libd    ca-dev libdvdnav-dev libexempi-dev libexif-dev libfaad-dev libgme-dev libgsm1-dev libiptcdata0-dev libkate-    dev libmimic-dev libmms-dev libmodplug-dev libmpcdec-dev libofa0-dev libopus-dev librsvg2-dev librtmp-dev l    ibslv2-dev libsndfile1-dev libsoundtouch-dev libspandsp-dev libx11-dev libxvidcore-dev libzbar-dev libzvbi-    dev liba52-0.7.4-dev libcdio-dev libdvdread-dev libmad0-dev libmp3lame-dev libmpeg2-4-dev libopencore-amrnb    -dev libopencore-amrwb-dev libsidplay1-dev libtwolame-dev libx264-dev libusb-1.0
```

* clone repositories

```
git clone git://anongit.freedesktop.org/git/gstreamer/gstreamer --branch 1.12.2
git clone git://anongit.freedesktop.org/git/gstreamer/gst-plugins-base --branch 1.12.2
git clone git://anongit.freedesktop.org/git/gstreamer/gst-plugins-good --branch 1.12.2
git clone git://anongit.freedesktop.org/git/gstreamer/gst-plugins-ugly --branch 1.12.2
git clone git://anongit.freedesktop.org/git/gstreamer/gst-omx --branch 1.12.2
```

* install core, base, good, ugly

```
./autogen.sh
make
sudo make install
```

* install gst-omx

raspberry PI

```
LDFLAGS='-L/opt/vc/lib' CPPFLAGS='-I/opt/vc/include -I/opt/vc/include/IL -I/opt/vc/include/interface/vcos/pthreads -I/opt/vc/include/interface/vmcs_host/linux' ./autogen.sh --with-omx-target=rpi
make CFLAGS+="-Wno-error"
sudo make install
```

ubuntu 16.04LTS

```
./autogen.sh --with-omx-target=generic
make
sudo make install
```

* ldconfig

```
sudo ldconfig
```


