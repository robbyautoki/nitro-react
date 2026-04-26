export const GetWiredTimeLocale = (value: number) =>
{
    if(value <= 0) return '0.0';

    const time = Math.floor((value / 2));

    if(!(value % 2)) return time.toString();

    return (time + 0.5).toString();
}
