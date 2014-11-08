#!/usr/bin/python

import csv
import matplotlib.pyplot as plt
import numpy as np
from numpy.fft import fft, fftfreq
import sys

def smoothList(list,strippedXs=False,degree=10):  
   if strippedXs==True: return Xs[0:-(len(list)-(len(list)-degree+1))]  
   smoothed=[0]*(len(list)-degree+1)  

   for i in range(len(smoothed)):  
       smoothed[i]=sum(list[i:i+degree])/float(degree)  

   return smoothed  


def getColumn(filename, column, cut):
    results = csv.reader(open("%s.csv" % filename), delimiter=";")
    return [result[column] for result in results][cut:-cut]

def getCsv(fileName, show=False, cut=1):
  time = getColumn(fileName,0, cut)
  x = getColumn(fileName,1,cut)
  y = getColumn(fileName,2,cut)
  z = getColumn(fileName,3,cut)

  plt.figure("Time/Values")
  plt.xlabel("Time(ms)")
  plt.ylabel("Accel")
  plt.plot(time,x)
  plt.plot(time,y)
  plt.plot(time,z)
  plt.savefig("%s-source" % fileName)
  if show:
    plt.show()
  return (time, x,y,z)

def doFourrier(data, outFile, show=False):
  (time, x,y,z) = data
  t = np.array([int(n) for n in time])
  signalx = np.array([float(n) for n in x])
  signaly = np.array([float(n) for n in y])
  signalz = np.array([float(n) for n in z])
  #print signal[:100]
  spx = smoothList([float(r) for r in fft(signalx)])
  spy = smoothList([float(r) for r in fft(signaly)])
  spz = smoothList([float(r) for r in fft(signalz)])
  freq = smoothList([float(r) for r in fftfreq(signalx.size, d=0.001)])
  sx = spx[(len(spx)/2)+5:]
  print "min x value %s on %s" % (sx[sx.index(min(sx))],sx.index(min(sx)))
  print "max x value %s on %s" % (sx[sx.index(max(sx))],sx.index(max(sx)))
  sy = spy[(len(spy)/2)+5:]
  print "min x value %s on %s" % (sy[sy.index(min(sy))],sy.index(min(sy)))
  print "max x value %s on %s" % (sy[sy.index(max(sy))],sy.index(max(sy)))

  plt.plot(freq, spx)
  plt.plot(freq, spy)
  plt.plot(freq, spz)
  plt.axis([-100,100,-1000,1000])
  plt.savefig("%s-fourrier" % outFile)
  if show:
    plt.show()

fileName = sys.argv[1]

data = getCsv(fileName, False, cut = 500)
doFourrier(data, fileName, True)






