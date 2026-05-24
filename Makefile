build-snap:
	snapcraft clean && snapcraft pack

snap-login:
	export SNAPCRAFT_STORE_CREDENTIALS=1
	snapcraft login

publish-snap:
	# pick the most recently modified .snap file and push it
	last=$$(ls -1t -- *.snap | head -n1); \
	if [ -z "$$last" ]; then echo "No .snap files found"; exit 1; fi; \
	snapcraft upload "$$last" --release=stable