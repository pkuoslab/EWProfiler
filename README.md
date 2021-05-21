# EWProfiler

An automated exploration tool for finding, measuring and auditing the WebView in mobile apps.

EWProfiler is proposed and used in the following empirical study of embedded Web browsing.
> Deyu Tian, Yun Ma, Aruna Balasubramanian, Yunxin Liu, Gang Huang, and Xuanzhe Liu. "Characterizing Embedded Web Browsing in Mobile Apps." IEEE Transactions on Mobile Computing (2021).

## Run

EWProfiler has three components in design: an explorer, an replayer, and a page collector. The explorer and the replayer is in the `manager` directory, and the page collector is in the `collector` directory.

The following is the overall steps of running EWProfiler.
* Connect the mobile device to the PC by a USB wire. Enable the remote debugging of the device.
* Install the mobile app that is going to be explored in the mobile device.
* Run the manager to explore the mobile app, and stop the exploration at some proper time. Remember saving the traversal graph before stopping the manager.
* Run the collector. Then run the manager to replay the exploration to WebView. During the replaying, the collector will collect the results.

The information of how to compile, build, install, and run these components is in the `README.md` file in the `manager` and `collector` directory.
