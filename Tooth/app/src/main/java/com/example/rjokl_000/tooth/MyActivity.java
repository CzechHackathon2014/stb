package com.example.rjokl_000.tooth;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.BitmapFactory;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;

import com.parse.Parse;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.SaveCallback;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MyActivity extends Activity implements SensorEventListener {

    final boolean btSource = true;
    boolean running = false;

    private SensorManager mSensorManager;
    private Sensor mSensor;
    private String sdata;
    private int sdatacount;
    BluetoothAdapter mBluetoothAdapter;
    ArrayList<String> mArrayAdapter;
    private BluetoothSocket btSocket = null;
    private static final UUID MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    final int RECIEVE_MESSAGE = 1;
    Random random = new Random();
    int cleaningId;

    public void onClick(View v) {
        running = ! running;
        Button button = (Button) findViewById(R.id.button);
        button.setText(running ? "Stop" : "Start");
        if (running) {
            cleaningId = random.nextInt();
        }
    }

    // Create a BroadcastReceiver for ACTION_FOUND
    private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            // When discovery finds a device
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                // Get the BluetoothDevice object from the Intent
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                // Add the name and address to an array adapter to show in a ListView
                String adapter = device.getName() + "\n" + device.getAddress();
                mArrayAdapter.add(adapter);
                Log.d("aa", adapter);
            }
        }
    };
    private ConnectedThread mConnectedThread;
    private Handler h;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my);
        sdatacount = 0;
        sdata = "";
        mArrayAdapter = new ArrayList<String>();

        // mira
        // Parse.initialize(this, "gDZsrEOBf5hmncOmG4gJsgFwTmPE6pmUl8CsGSG5", "kcgdE3vTUpjJ6TdaqTndLoj2KxkijCM0yu3nXpT8");
        // jarda
        Parse.initialize(this, "LTxpj4PZ88hs9OwNLobWYwzI2Xr1nAAQpD555oPc", "WQV7TgBSSvA1j5uBj7GIeVyWm4byMSDkcW7rMfU3");

        h = new Handler() {
            public void handleMessage(android.os.Message msg) {
                switch (msg.what) {
                    case RECIEVE_MESSAGE:
                        //A: x:    -8 y:   -16 z: -1040 M: x:   122 y:  -307 z:   459
                        Pattern dp = Pattern.compile("A: x: +(-?\\d+) y: +(-?\\d+) z: +(-?\\d+) M: x: +(-?\\d+) y: +(-?\\d+) z: +(-?\\d+)", Pattern.CASE_INSENSITIVE);
                        String line = (String)msg.obj;

                        Matcher m = dp.matcher(line);
                        if (m.find()) {
                            addSample(
                                    Float.parseFloat(m.group(1))/100,
                                    Float.parseFloat(m.group(2))/100,
                                    Float.parseFloat(m.group(3))/100,
                                    Float.parseFloat(m.group(4))/100,
                                    Float.parseFloat(m.group(5))/100,
                                    Float.parseFloat(m.group(6))/100
                            );
                            //Log.d("handler", line);
                        }
                        break;
                }
            };
        };

        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        mSensor = mSensorManager.getDefaultSensor(Sensor.TYPE_GRAVITY);

        mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_GAME);

        mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

        if (!mBluetoothAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBtIntent, 1);
        }

        // Register the BroadcastReceiver
        IntentFilter filter = new IntentFilter(BluetoothDevice.ACTION_FOUND);
        registerReceiver(mReceiver, filter); // Don't forget to unregister during onDestroy

        mBluetoothAdapter.startDiscovery();

        BluetoothDevice device = mBluetoothAdapter.getRemoteDevice("20:13:09:30:16:50");

        if (btSource) {
            try {
                btSocket = createBluetoothSocket(device);
                btSocket.connect();
            } catch (IOException e) {
                e.printStackTrace();
            }

            mConnectedThread = new ConnectedThread(btSocket);
            mConnectedThread.start();
        }

        ImageView view = (ImageView) findViewById(R.id.imageView);
        view.setImageBitmap(BitmapFactory.decodeResource(getResources(), R.drawable.test));

    }

    private BluetoothSocket createBluetoothSocket(BluetoothDevice device) throws IOException {
            try {
                final Method m = device.getClass().getMethod("createInsecureRfcommSocketToServiceRecord", new Class[] { UUID.class });
                return (BluetoothSocket) m.invoke(device, MY_UUID);
            } catch (Exception e) {
                Log.e("aa", "Could not create Insecure RFComm Connection",e);
            }
        return  device.createRfcommSocketToServiceRecord(MY_UUID);
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.my, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onSensorChanged(SensorEvent sensorEvent) {

        if ( ! btSource) {
            //Log.d("tag", String.format("%03.2f %03.2f %03.2f", sensorEvent.values[0], sensorEvent.values[1], sensorEvent.values[2]));
            addSample(sensorEvent.values[0], sensorEvent.values[1], sensorEvent.values[2], 0, 0, 0);
        }
    }

    private void addSample(float x, float y, float z, float a, float b, float c) {

        if (!running)
            return;


        sdatacount++;

        if (!sdata.isEmpty()) {
            sdata += "|";
        }

        sdata += "timestamp:" + System.currentTimeMillis()  + " point:" + String.format(Locale.ENGLISH, "%03.2f,%03.2f,%03.2f,%03.2f,%03.2f,%03.2f", x, y, z, a, b, c) ;
        if (sdatacount == 10) {

            Log.d("tag", String.format("%s", sdata));

            ParseObject testObject = new ParseObject("SensorData");
            testObject.put("data", sdata);
            testObject.put("cleaningId", cleaningId);
            testObject.saveInBackground(new SaveCallback() {
                @Override
                public void done(ParseException e) {
                    if (e != null) {
                        Log.e("mx", "save failed", e);
                    } else {
                        Log.d("mx", "save done");
                    }
                }
            });

            sdatacount = 0;
            sdata = "";

            //ImageView view = (ImageView) findViewById(R.id.imageView);
            //view.setAlpha((float)(System.currentTimeMillis() % 1000) / 1000);
            //Log.d("asd", String.format("%d, %d", view.getWidth(), view.getHeight()));
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int i) {

    }

    private class ConnectedThread extends Thread {
        private final InputStream mmInStream;
        private final OutputStream mmOutStream;

        public ConnectedThread(BluetoothSocket socket) {
            InputStream tmpIn = null;
            OutputStream tmpOut = null;

            // Get the input and output streams, using temp objects because
            // member streams are final
            try {
                tmpIn = socket.getInputStream();
                tmpOut = socket.getOutputStream();
            } catch (IOException e) { }

            mmInStream = tmpIn;
            mmOutStream = tmpOut;
        }

        public void run() {
            String line; // line returned from read()
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(mmInStream));

            // Keep listening to the InputStream until an exception occurs
            while (true) {
                try {
                    // Read from the InputStream
                    line = bufferedReader.readLine();        // Get number of line and message in "buffer"
                    Message message = h.obtainMessage(RECIEVE_MESSAGE, line);
                    message.sendToTarget();     // Send to message queue Handler

                    Log.d("thread: ", line);

                } catch (IOException e) {
                    //break;
                }
            }
        }

        /* Call this from the main activity to send data to the remote device */
        public void write(String message) {
            Log.d("aa", "...Data to send: " + message + "...");
            byte[] msgBuffer = message.getBytes();
            try {
                mmOutStream.write(msgBuffer);
            } catch (IOException e) {
                Log.d("aa", "...Error data send: " + e.getMessage() + "...");
            }
        }
    }

}
