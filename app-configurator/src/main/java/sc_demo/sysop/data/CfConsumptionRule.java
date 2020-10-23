package sc_demo.sysop.data;

import se.arkalix.dto.DtoReadableAs;
import se.arkalix.dto.DtoToString;

import java.util.List;

import static se.arkalix.dto.DtoEncoding.JSON;

@DtoReadableAs(JSON)
@DtoToString
public interface CfConsumptionRule {
    String consumer();

    List<String> services();

    List<String> providers();
}
