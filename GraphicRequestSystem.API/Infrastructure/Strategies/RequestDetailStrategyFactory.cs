using GraphicRequestSystem.API.Core.Interfaces;

namespace GraphicRequestSystem.API.Infrastructure.Strategies
{
    public class RequestDetailStrategyFactory
    {
        private readonly IReadOnlyDictionary<string, IRequestDetailStrategy> _strategies;
        private readonly DefaultRequestStrategy _defaultStrategy;

        public RequestDetailStrategyFactory(IEnumerable<IRequestDetailStrategy> strategies)
        {
            _strategies = strategies.ToDictionary(s => s.StrategyName);
            _defaultStrategy = (DefaultRequestStrategy)_strategies.FirstOrDefault(s => s.GetType() == typeof(DefaultRequestStrategy)).Value;
        }

        public IRequestDetailStrategy GetStrategy(string requestTypeName)
        {
            if (_strategies.TryGetValue(requestTypeName, out var strategy))
            {
                return strategy;
            }
            return _defaultStrategy;
        }
    }
}