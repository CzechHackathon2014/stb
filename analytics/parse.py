#!/usr/bin/python

import parse_rest
from operator import itemgetter
from parse_rest.connection import register
from parse_rest.datatypes import Object
import matplotlib.pyplot as plt
import numpy as np
from numpy.fft import fft, fftfreq
import sys, os, time

register("LTxpj4PZ88hs9OwNLobWYwzI2Xr1nAAQpD555oPc", "NOl6eSpzXjySARLWGrIHgLD4qohcTQ8zzq0clLQP ",master_key="c986CTxK2mPM4zWKwufNXeK6AXLftmunA8hDF8WC")

def smoothList(list,strippedXs=False,degree=5):  
   if strippedXs==True: return Xs[0:-(len(list)-(len(list)-degree+1))]  
   smoothed=[0]*(len(list)-degree+1)  

   for i in range(len(smoothed)):  
       smoothed[i]=sum(list[i:i+degree])/float(degree)  

   return smoothed  


class SensorData(Object):
  pass

def getData():
  records = []

  for batch in SensorData.Query.all().order_by("-createdAt"):
    for b in batch.data.split(' '):
      if '|' in b:
        (dataPoint,dataTimestamp) = b.split('|')
        point = dataPoint.split(':')[1]
        timestamp = dataTimestamp.split(':')[1]
        try:
          (x,y,z,a,b,c) = point.split(',')
        except:
          (x,y,z) = point.split(',')
        records.append({'t':timestamp,'x':x,'y':y,'z':z})
      if len(records) > 100:
        break
    if len(records) > 100:
      break

  x = []
  y = []
  z = []
  t = []

  for r in sorted(records, key=itemgetter('t')):
    x.append(r['x'])
    y.append(r['y'])
    z.append(r['z'])
    t.append(r['t'])
  return (t, x,y,z)

def doFourrier(data, outFile, show=False):
  (time, x,y,z) = data
  t = np.array([int(n) for n in time])
  signalx = np.array([float(n) for n in x])
  signaly = np.array([float(n) for n in y])
  signalz = np.array([float(n) for n in z])
  spx = smoothList([float(r) for r in fft(signalx)])
  spy = smoothList([float(r) for r in fft(signaly)])
  spz = smoothList([float(r) for r in fft(signalz)])
  freq = smoothList([float(r) for r in fftfreq(signalx.size, d=0.001)])
  sx = spx[(len(spx)/2)+2:]
  if sx:
    print "min x -- %s on %s" % (sx[sx.index(min(sx))],sx.index(min(sx)))
    print "max x -- %s on %s" % (sx[sx.index(max(sx))],sx.index(max(sx)))
  sy = spy[(len(spy)/2)+2:]
  if sy:
    print "min y -- %s on %s" % (sy[sy.index(min(sy))],sy.index(min(sy)))
    print "max y -- %s on %s" % (sy[sy.index(max(sy))],sy.index(max(sy)))
  sz = spz[(len(spz)/2)+2:]
  if sz:
    print "min z -- %s on %s" % (sz[sz.index(min(sz))],sz.index(min(sz)))
    print "max z -- %s on %s" % (sz[sz.index(max(sz))],sz.index(max(sz)))
  
  plt.plot(sx)
  plt.plot(sy)
  plt.plot(sz)
  plt.axis([0,55,-200,200])
  plt.savefig("%s-fourrier" % outFile)
  if show:
    plt.show()
  plt.clf()
  

def displaySource(data, fileName, show=False,):
  (time, x,y,z) = data
  plt.figure("Time/Values")
  plt.xlabel("Time(ms)")
  plt.ylabel("Accel")
  plt.plot(time,x)
  plt.plot(time,y)
  plt.plot(time,z)
  plt.savefig("%s-source" % fileName)
  #print time, x,y,z
  if show:
    plt.show()
  plt.clf() 

def fakeData():
  x = np.sin(np.linspace(-np.pi, 10*np.pi, 400))
  y = np.sin(np.linspace(2+np.pi, 10*np.pi+2, 400))
  z = np.sin(np.linspace(1+10*np.pi, 10*np.pi+1, 400))
  t = range(400)
  return(t,x,y,z)

while True:
  data = getData()
  datatime = long(long(max(data[0]))/1000)
  nowtime = long(time.time())
  print '.',
  if datatime + 2 > nowtime:
    print
    print 'Number of records: %s' % len(data[0])
    print ' Now time: %s' % long(time.time())
    print 'Data time: %s' % datatime
    displaySource(data, 'real')
    doFourrier(data, 'real', False)
    print '--------------'
  time.sleep(2)
  
