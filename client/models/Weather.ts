class Weather {
    temperature: number;
    description: string;
    imgSrc: string;

    constructor(temperature: number, description: string, imgSrc: string) {
        this.temperature = temperature;
        this.description = description;
        this.imgSrc = imgSrc;
    }
};

export default Weather;