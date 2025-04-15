import { vec3 } from "gl-matrix";

import Body from "./body";

export default class SolarSystemObjects {
    objects: {
        children: Array<Body>;
    };
    constructor() {
        this.objects = {
            children: []
        };

        let convert = function (coord: string) {
            let parts = coord.replace("  ", " ").replace("  ", " ").split(" ");
            return vec3.fromValues(
                parseFloat(parts[0]) * 1000,
                parseFloat(parts[1]) * 1000,
                parseFloat(parts[2]) * 1000
            );
        };

        this.objects.children.push(
            new Body({
                position: vec3.fromValues(0, 0, 0),
                velocity: vec3.fromValues(0, 0, 0),
                mass: 1988550000000000000000000000000, // kg
                radius: 696342000, // m
                color: "#e9e8e2",
                name: "Sun"
            })
        );

        this.objects.children.push(
            new Body({
                position: convert(
                    "-5.712159217109616E+07 -2.768031363154984E+07  2.978624897562783E+06"
                ),
                velocity: convert(
                    "1.119288899412350E+01 -4.171662896323060E+01 -4.435605216855379E+00"
                ),
                mass: 330200000000000000000000, // kg
                radius: 2439700, // m
                color: "#e9e8e2",
                name: "Mercury"
            })
        );

        this.objects.children.push(
            new Body({
                position: convert(
                    "5.694739460521039E+07 -9.274270607050946E+07 -4.557883971697539E+06"
                ),
                velocity: convert(
                    "2.960971536139958E+01  1.820477076651326E+01 -1.459048431903065E+00"
                ),
                mass: 4868500000000000000000000, // kg
                radius: 6051800, // m
                color: "#e9e8e2",
                name: "Venus"
            })
        );

        this.objects.children.push(
            new Body({
                position: convert(
                    "1.264592801679844E+08  7.833040666290237E+07 -3.464586605969816E+03"
                ),
                velocity: convert(
                    "-1.616516421746471E+01  2.522294601446111E+01 -1.918752003394530E-03"
                ),
                mass: 5973600000000000000000000, // kg
                radius: 6371000, //m
                color: "#e9e8e2",
                name: "Earth"
            })
        );
        {
            this.objects.children.push(
                new Body({
                    position: convert(
                        "1.261270860702455E+08  7.853762786903098E+07 -1.161962384453788E+04"
                    ),
                    velocity: convert(
                        "-1.673771965809977E+01  2.440613215219513E+01  8.420971395564081E-02"
                    ),
                    mass: 7.34767309e22, // kg
                    radius: 1737400, //m
                    color: "#e9e8e2",
                    name: "Luna"
                })
            );
        }

        this.objects.children.push(
            new Body({
                position: convert(
                    "1.845270655123906E+08 -9.280895724399856E+07 -6.473556801981751E+06"
                ),
                velocity: convert(
                    "1.180981129374965E+01  2.372068075334774E+01  2.072432727324305E-01"
                ),
                mass: 641850000000000000000000, // kg
                radius: 3389500, // m
                color: "#e9e8e2",
                name: "Mars"
            })
        );
        // Move too fast/too close to predict at high speeds.
        /*{
            this.objects.children.push(new Body({
                position: convert("1.845188579065700E+08 -9.280851819688110E+07 -6.469264816001739E+06"),
                velocity: convert("1.167266163030102E+01  2.156556366892409E+01  1.171327274146359E-01"),
                mass: 1.0659E+16, // kg
                radius: 11100, // m
                color: "#e9e8e2",
                name: "Phobos"
            }));

            this.objects.children.push(new Body({
                position: convert("1.845110256020578E+08 -9.282498330452713E+07 -6.467520919466183E+06"),
                velocity: convert("1.261241456936112E+01  2.274063637155379E+01 -2.621303953674605E-01"),
                mass: 1.4762E+15, // kg
                radius: 6200, // m
                color: "#e9e8e2",
                name: "Deimos"
            }));
        }*/

        this.objects.children.push(
            new Body({
                position: convert(
                    "-8.117479716576955E+08 -7.908365271344987E+07  1.849227293866055E+07"
                ),
                velocity: convert(
                    "1.111831869435202E+00 -1.239931464570384E+01  2.660180174566662E-02"
                ),
                mass: 1898600000000000000000000000, // kg
                radius: 69911000, // m
                color: "#e9e8e2",
                name: "Jupiter"
            })
        );
        // Move too fast/too close to predict at high speeds.
        /*{
            this.objects.children.push(new Body({
                position: convert("-8.106835420319070E+08 -7.897701654880986E+07  1.851031342918840E+07"),
                velocity: convert("3.478699364464347E-02 -1.575216306110985E+00  4.215773553722360E-01"),
                mass: 1.4819E+23, // kg
                radius: 2631200, // m
                color: "#e9e8e2",
                name: "Ganymede"
            }));

            this.objects.children.push(new Body({
                position: convert("-8.113817936470783E+08 -7.724174347238193E+07  1.855566960827620E+07"),
                velocity: convert("-6.938706028683963E+00 -1.073700434181273E+01 -2.823848090122683E-02"),
                mass: 1.075938E+23, // kg
                radius: 2410300, // m
                color: "#e9e8e2",
                name: "Callisto"
            }));

            this.objects.children.push(new Body({
                position: convert("-8.121659297649524E+08 -7.912455826115237E+07  1.848477657629113E+07"),
                velocity: convert("2.817899691749439E+00 -2.971451992476553E+01 -5.617314807311864E-01"),
                mass: 8.9319E+22, // kg
                radius: 1821300, // m
                color: "#e9e8e2",
                name: "Io"
            }));

            this.objects.children.push(new Body({
                position: convert("-8.110868246436803E+08 -7.901820122891928E+07  1.850631425153826E+07"),
                velocity: convert("-2.641780726925746E-01  1.396529490532279E+00  6.076700375807109E-01"),
                mass: 4.80E+22, // kg
                radius: 1569000, // m
                color: "#e9e8e2",
                name: "Europa"
            }));
        }*/

        this.objects.children.push(
            new Body({
                position: convert(
                    "-3.319983872084137E+08 -1.464702298462686E+09  3.867402850039631E+07"
                ),
                velocity: convert(
                    "8.894875779460287E+00 -2.173824673813452E+00 -3.168643893414061E-01"
                ),
                mass: 568460000000000000000000000, // kg
                radius: 58232000, // m
                color: "#e9e8e2",
                name: "Saturn"
            })
        );
        // Move too fast/too close to predict at high speeds.
        /*{
            this.objects.children.push(new Body({
                position: convert("-3.332129016834406E+08 -1.464906147468015E+09  3.889954846384144E+07"),
                velocity: convert("1.020228503037018E+01 -6.916261691497928E+00  1.997964979677635E+00"),
                mass: 1.3452E+23, // kg
                radius: 2575500, // m
                color: "#e9e8e2",
                name: "Titan"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.314735649385341E+08 -1.464727174926236E+09  3.863865643924379E+07"),
                velocity: convert("8.990379754165014E+00  5.362144268760609E+00 -4.230809357375609E+00"),
                mass: 2.306518E+21, // kg
                radius: 763800, // m
                color: "#e9e8e2",
                name: "Rhea"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.286376468797154E+08 -1.464369281644833E+09  3.791867206260294E+07"),
                velocity: convert("8.418116357785856E+00  1.082261049135830E+00 -9.742162325575066E-01"),
                mass: 1.805635E+21, // kg
                radius: 734500, // m
                color: "#e9e8e2",
                name: "Iapetus"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.318720262082482E+08 -1.465022816452283E+09  3.882975248917311E+07"),
                velocity: convert("1.829490501292676E+01  4.186911947488139E-01 -2.580741002991797E+00"),
                mass: 1.095452E+21, // kg
                radius: 561400, // m
                color: "#e9e8e2",
                name: "Dione"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.318171047591899E+08 -1.464502976008407E+09  3.855457931186026E+07"),
                velocity: convert("-2.134914710680546E-02  4.288919838069786E+00 -3.063897689667870E+00"),
                mass: 6.17449E+20, // kg
                radius: 531100, // m
                color: "#e9e8e2",
                name: "Tethys"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.317603694689049E+08 -1.464707284731708E+09  3.865356371261227E+07"),
                velocity: convert("8.662785276650990E+00  8.981126694573010E+00 -6.138906415958941E+00"),
                mass: 1.08022E+20, // kg
                radius: 252100, // m
                color: "#e9e8e2",
                name: "Enceladus"
            }));

            this.objects.children.push(new Body({
                position: convert("-3.321718370352902E+08 -1.464632452860750E+09  3.864965707639062E+07"),
                velocity: convert("3.577844840098914E+00 -1.362377355179795E+01  5.929235255374333E+00"),
                mass: 3.7493E+19, // kg
                radius: 198200, // m
                color: "#e9e8e2",
                name: "Mimas"
            }));
        }*/

        this.objects.children.push(
            new Body({
                position: convert(
                    "2.759250748323915E+09  1.135821330762241E+09 -3.150929789768779E+07"
                ),
                velocity: convert(
                    "-2.639269061567873E+00  5.967885294896440E+00  5.632370739997983E-02"
                ),
                mass: 86832000000000000000000000, // kg
                radius: 25362000, // m
                color: "#e9e8e2",
                name: "Uranus"
            })
        );

        this.objects.children.push(
            new Body({
                position: convert(
                    "4.228767141988930E+09 -1.480414746887066E+09 -6.696904625910568E+07"
                ),
                velocity: convert(
                    "1.761898374990371E+00  5.150165602780147E+00 -1.469294934753780E-01"
                ),
                mass: 102430000000000000000000000, // kg
                radius: 24622000, // m
                color: "#e9e8e2",
                name: "Neptune"
            })
        );

        this.objects.children.push(
            new Body({
                position: convert(
                    "1.413855749362500E+09 -4.760100107320454E+09  1.002026373460095E+08"
                ),
                velocity: convert(
                    "5.312482020767150E+00  4.070865177816018E-01 -1.565157366677656E+00"
                ),
                mass: 1310500000000000000000, // kg
                radius: 1186000, // m
                color: "#e9e8e2",
                name: "Pluto"
            })
        );
    }
}
