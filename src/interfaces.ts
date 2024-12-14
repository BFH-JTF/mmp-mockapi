
// Category
export interface ILifestyle {
    houseType: number,
    heatingType: number,
    houseAge: number,
    temp: number,
    area: number,
    persons: number,
    warmWaterType: number,
    efficiency: number,
    fridge: number,
    washing: number
    drying: number
    eco: number
    clothes: number
    entertainment: number
    furniture: number
    eatOut: number,
    investments: number
}

export interface ILifeStyleEmissions {
    housing_co2: number,
    energy_co2: number,
    consumption_co2: number
}

export interface IDailyItem {
    id?: number,
    userID?: number,
    date: string,
    amountNumeric?: number,
    amountOption?: number,
    itemID: number,
}

export interface IUserInfo {
    id?: number,
    name: string,
    group: number,
    admin: number,
    loginType: string,
    credentials: string
}

export interface IGroupInfo {
    id?: number,
    name: string,
    periodStart: string,
    periodEnd: string,
    owner: number
}