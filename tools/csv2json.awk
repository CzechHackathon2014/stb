BEGIN {
	FS=";"
	print "[\n"
}
{
	printf "  { \"time\": %d, \"point\": { \"x\": %f, \"y\": %f, \"z\": %f} },\n", $1, $2, $3, $4
}
END {
	print "]\n"
}
