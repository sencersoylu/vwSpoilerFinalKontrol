const snap7 = require('node-snap7');
const { SerialPort } = require('serialport');
const pad = require('pad');
const { DelimiterParser } = require('@serialport/parser-delimiter');

const port = new SerialPort({
	path: 'COM7',
	baudRate: 9600,
});

const parser = port.pipe(new DelimiterParser({ delimiter: '$' }));

const typeDetect = (data) => {
	console.log(data);
	if (data.includes('3J0827933.1')) {
		return 'SPDES';
	} else if (data.includes('3J0827939.2')) {
		return 'SLFNDES';
	} else if (data.includes('3J0827939.1')) {
		return 'SLFNEST';
	} else if (data.includes('3J0827940.2')) {
		return 'SGFNDES';
	} else if (data.includes('3J0827940.1')) {
		return 'SGFNEST';
	} else if (data.includes('VW S')) {
		return 'SPEST';
	} else if (data.includes('3J0971171')) {
		return 'SPKABLO';
	} else if (data.startsWith('X')) {
		return 'SPLAMBA';
	} else return 'ERR';
};

port.on('open', () => console.log('Port open'));
port.on('close', () => {
	console.log('Port close');
	setTimeout(() => {
		port.open();
	}, 5000);
});
port.on('error', (err) => {
	console.error(err);
	setTimeout(() => {
		port.open();
	}, 5000);
});

parser.on('data', (data) => {
	data = data.toString();

	data = data
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$')
		.replace('\r\n', '$');
	console.log(data);

	let type = typeDetect(data);

	var s7client = new snap7.S7Client();
	var ok_buf = Buffer.from('1', 'utf-8');

	var b1 = new Buffer([0x64, 0x64]);

	var buf = Buffer.from(pad(data, 100), 'ascii');

	var b2 = new Buffer([0x5, 0x5]);

	let renk = '0';

	var buf2 = Buffer.from(pad(renk, 5), 'ascii');

	var b3 = new Buffer([0x00, 0x07, 0x07]);

	var buf3 = Buffer.from(pad(type, 7), 'ascii');

	var b4 = new Buffer([0x00]);

	let status = type != 'ERR' ? 1 : 2;

	let BARKOD_DURUM = Buffer.allocUnsafe(2);
	BARKOD_DURUM.writeInt16BE(status, 0);

	var b5 = new Buffer([0x01]);

	var arr = [b1, buf, b2, buf2, b3, buf3, b4, BARKOD_DURUM, b5];

	buf = Buffer.concat(arr);

	console.log(type);

	s7client.ConnectTo('192.168.1.10', 0, 1, function (err) {
		if (err)
			return console.log(
				' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err)
			);

		// console.log("read data");

		console.log('write data');
		s7client.DBWrite(206, 0, buf.length, buf, function (err, res) {
			if (err) {
				return console.log(
					' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err)
				);
			}

			s7client.MBWrite(170, ok_buf.length, ok_buf, function (err, res) {
				if (err) {
					return console.log(
						' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err)
					);
					s7client.Disconnect();
				}

				s7client.Disconnect();
			});
		});
	});
});

setInterval(async () => {
	try {
		var s7client = new snap7.S7Client();

		s7client.ConnectTo('192.168.1.10', 0, 1, function (err) {
			if (err)
				return console.log(
					' >> Connection failed. Code #' +
						err +
						' - ' +
						s7client.ErrorText(err)
				);

			// console.log("read data");

			console.log('Live Bit...');

			s7client.WriteArea(
				s7client.S7AreaDB,
				206,
				122 * 8 + 1,
				1,
				s7client.S7WLBit,
				Buffer.from([0x01]),
				function (err) {
					if (err) {
						return console.error(s7client.ErrorText(err));
					}
					s7client.Disconnect();
				}
			);
		});
	} catch (err) {
		console.error(err);
	} finally {
		isWorking = false;
	}
}, 10 * 1000);
