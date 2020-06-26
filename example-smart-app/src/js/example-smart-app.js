(function(window){
	window.coordinates = [];
	var singlePatient_ind = false;

  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
				singlePatient_ind = true;
        var patient = smart.patient;
        var pt = patient.read();

        $.when(pt).fail(onError);

        $.when(pt).done(function(patient) {
          var gender = patient.gender;
          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;
          }

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;

					lookupGeocode(patient.address).then(function (coordinates){
						p.coordinates = coordinates;
						window.coordinates = [coordinates];
						ret.resolve(p);
					});
        });
      } else {
        var patient_list = prompt("What patients do you want to lookup?").split(" ");
        var pt_promises = [];
        for (var idx = 0; idx < patient_list.length; idx += 1) {
        	var pt_id = patient_list[idx];
        	if (pt_id.length > 0) {
						var pt = smart.api.search({type: 'Patient', 'patient': pt_id});
						pt_promises.push(pt);
					}
				}
        if (pt_promises.length > 0) {
					$.when(...pt_promises).done(function (...patient_data) {
						var geo_promises = [];
						for (var idx = 0; idx < patient_data.length; idx += 1) {
							var entries = patient_data[idx].data.entry;
							if (entries.length > 0){
								var geo = lookupGeocode(entries[0].resource.address);
								geo_promises.push(geo);
							}
						}
						if (geo_promises.length > 0) {
							$.when(...geo_promises).done(function(...coordinates){
								window.coordinates = coordinates;
								ret.resolve();
							});
						}
						else {
							alert("No geocodes found");
							ret.resolve();
						}
					});
				}
        else {
        	alert("No patients provided");
					ret.resolve();
				}
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function lookupGeocode(fhirAddress){
		var defer = $.Deferred();
		var fullAddress = '';
		if (typeof fhirAddress !== 'undefined' && fhirAddress.length > 0) {
			var address = fhirAddress[0];
			fullAddress = encodeURI(address.city + ',' + address.state + ' ' + address.postalCode)
		}
		var geocode = {
			"url": "https://open.mapquestapi.com/geocoding/v1/address?key=rJam5yuMtlUxrAr0N1LggtYGd7Q9vvB0&location=" + fullAddress,
			"method": "GET",
			"timeout": 0,
		};

		$.ajax(geocode).done(function (response) {
			if (response.results.length > 0) {
				var result = response.results[0];
				if (result.locations.length > 0) {
					defer.resolve(result.locations[0].displayLatLng);
				}
			}
		});

		return defer.promise();
	}

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      coordinates: {lat: 0, lng: 0}
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
		$('#loading').hide();
  	if (singlePatient_ind) {
			$('#holder').show();
			$('#fname').html(p.fname);
			$('#lname').html(p.lname);
			$('#gender').html(p.gender);
			$('#birthdate').html(p.birthdate);
			$('#height').html(p.height);
			$('#systolicbp').html(p.systolicbp);
			$('#diastolicbp').html(p.diastolicbp);
			$('#ldl').html(p.ldl);
			$('#hdl').html(p.hdl);
			$('#coordinates').html(p.coordinates.lat + ", " + p.coordinates.lng);
		}
  };

})(window);
