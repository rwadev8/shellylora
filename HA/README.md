# HA template sensors

To be able to use the data in e.g. statistics graphs, template sensors need to be befined.
The sensors here include some error checking to deal with bad numbers in case the lora connection is very poor

dealing with outliers seems to be a really big headache. no mater what i have tried so far, still seems to have probems.
then i discovered the filter sensor in HA i tried those, but they also are not yaml reload resistant, i.e. the max values in the filter tend to show up in the data when reloading the yaml config. also it seems that the range filter just cuts values off, claude seem to indicate after presenting an explicit problem case that there are known issues with the filter sensor (naturally after first agreeing that using the filter would be an elegant solution and suggesting to use an outlier filter after the range filter for a power sensor

Suggestions for improvements welcome.
