const curly = new RegExp("{([a-z0-9]+)}", "gi");
const dollar = /\$\$([a-z0-9]+)\$\$/gi;

const format = (localizationString, replaceWith) => 
{
	let matched,
		regexToUse,
		formattedString = localizationString;

	if (formattedString.match(curly))
	{
		regexToUse = curly;
	}
	else if (formattedString.match(dollar))
	{
		regexToUse = dollar;
	}

	if (regexToUse)
	{
		while (matched = regexToUse.exec(localizationString))
		{
			const replaceThis = matched[0];
			const replaceKey = matched[1];

			if (replaceWith[replaceKey] !== undefined)
			{
				formattedString = formattedString.replace(replaceThis, replaceWith[replaceKey]);
			}
		}
	}

	return formattedString;
};

const localizerProxy = new Proxy({}, {
	get(_, fileName, __)
	{
		if (fileName in __localizer && typeof __localizer[fileName] !== "object")
		{
			return __localizer[fileName];
		}

		if (Bnet.Utilities.String.equals(fileName, "CurrentCultureName", Bnet.StringCompareOptions.IgnoreCase))
		{
			return __localizer.CurrentCultureName;
		}

		if (Bnet.Utilities.String.equals(fileName, "ValidLocales", Bnet.StringCompareOptions.IgnoreCase))
		{
			return __localizer.validLocales;
		}

		if (Bnet.Utilities.String.equals(fileName, "Format", Bnet.StringCompareOptions.IgnoreCase)
			|| Bnet.Utilities.String.equals(fileName, "fnStringReplace", Bnet.StringCompareOptions.IgnoreCase))
		{
			return new Proxy(format, {
				apply(target, thisArg, argumentsList)
				{
					return target(argumentsList[0], argumentsList[1]);
				}
			});
		}

		const fileProxy = new Proxy({}, {
			get(___, stringName, ____)
			{
				let returnable = null;
				const fileStrings = __localizer[fileName];
				if (stringName === "__all")
				{
					return fileStrings;
				}

				const fixedStringName = stringName.toLowerCase();
				if (fileStrings)
				{
					const innerValue = fileStrings[fixedStringName];
					if (innerValue !== undefined)
					{
						returnable = innerValue;
					}
				}

				if (!returnable)
				{
					returnable = `##${fileName}.${stringName}##`;
				}


				return returnable;
			}
		});

		return fileProxy;
	}
});

window.Localizer = localizerProxy;
