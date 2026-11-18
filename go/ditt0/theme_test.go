package ditt0

import "testing"

func TestForNameFallsBackToDark(t *testing.T) {
	cases := map[string]string{"light": "light", "light-daltonized": "light", "dark": "dark", "dark-ansi": "dark", "": "dark"}
	for name, want := range cases {
		if got := ForName(name).Name; got != want {
			t.Errorf("ForName(%q) = %q, want %q", name, got, want)
		}
	}
}

func TestSeverityReusesStatusColours(t *testing.T) {
	if Dark.Severity("fatal") != Dark.Error || Dark.Severity("WARN") != Dark.Warning {
		t.Fatal("FATAL should draw as error and WARN as warning")
	}
	if Dark.Severity("NOTICE") != Dark.Unknown {
		t.Fatal("an unknown level should draw as unknown")
	}
}

func TestSpanOKIsInfoNotHealthy(t *testing.T) {
	if Light.SpanStatus("OK") != Light.Info {
		t.Fatal("a fine span draws as info")
	}
}

func TestSeriesWrapsAndKeepsDash0Order(t *testing.T) {
	if Dark.SeriesColor(0) != "#828aff" || Dark.SeriesColor(len(Dark.Series)) != Dark.Series[0] {
		t.Fatal("series should start with Dash0's first auto colour and wrap")
	}
	if Dark.SeriesColor(-1) != Dark.SeriesUnset {
		t.Fatal("a series with no index draws unset")
	}
}

// This order has to stay Dash0's
func TestManagedSeriesColorFollowsDash0sColourManager(t *testing.T) {
	want := []string{"#828aff", "#225584", "#d8b4fe", "#b89d6a", "#74d1f0", "#d0af57", "#829ed6", "#6d459b", "#a39999"}
	for i, w := range want {
		if got := Dark.ManagedSeriesColor(i); got != w {
			t.Errorf("ManagedSeriesColor(%d) = %s, want %s", i, got, w)
		}
	}
	if Dark.ManagedSeriesColor(9) != want[0] {
		t.Error("the managed order wraps")
	}
}
